import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db } from '../supabase.js';
import { config } from '../config.js';
import { ApiError, erroDoBanco, naoEncontrado, validacao } from '../erros.js';
import { doBanco, paraBanco } from '../mapear.js';
import { criarRdoVazio, reaproveitarDoAnterior, conteudoTecnico } from '../../../src/domain/rdo.js';
import { validarRdo } from '../../../src/domain/validation.js';
import { declaracaoCliente, declaracaoMaster } from '../../../src/constants/texts.js';

const tabelas = {
  maoDeObra: 'mao_de_obra',
  equipamentos: 'equipamentos',
  atividades: 'atividades',
  materiais: 'materiais',
  qualidade: 'qualidade',
  incidentes: 'incidentes',
  ocorrencias: 'ocorrencias',
  visitas: 'visitas',
  fotos: 'fotos',
  pendencias: 'pendencias',
};

const blocosCabecalho = [
  'data', 'turno', 'identificacao', 'clima', 'observacaoMaoDeObra', 'semProducao', 'planejamento',
  'semRegistro', 'seguranca', 'observacoesGerais', 'declaracao',
];

function falha(error) {
  if (error) throw erroDoBanco(error);
}

function serializarHash(valor) {
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(serializarHash).join(',')}]`;
  return `{${Object.keys(valor).filter((k) => valor[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${serializarHash(valor[k])}`).join(',')}}`;
}

function hashOf(valor) {
  return createHash('sha256').update(serializarHash(valor)).digest('hex');
}

function fotoParaApi(linha, rdoId) {
  const foto = doBanco(linha);
  return {
    id: foto.id,
    numero: foto.numero,
    url: `/api/v1/rdos/${rdoId}/fotos/${foto.id}/arquivo`,
    legenda: foto.legenda,
    local: foto.local,
    vinculo: foto.vinculoTipo ? { tipo: foto.vinculoTipo, id: foto.vinculoId } : null,
    autorId: foto.autorId,
    dataHora: foto.dataHora,
    coordenada: foto.latitude == null || foto.longitude == null ? null : { latitude: foto.latitude, longitude: foto.longitude },
    meta: { largura: foto.largura, altura: foto.altura, compressao: foto.compressao },
  };
}

function comErro(status, codigo, mensagem) {
  return new ApiError(status, codigo, mensagem);
}

async function consultarObra(obraId) {
  const { data, error } = await db.from('obras').select('*').eq('id', obraId).maybeSingle();
  falha(error);
  if (!data) throw naoEncontrado('Obra');
  const [{ data: cliente, error: erroCliente }, { data: rt, error: erroRt }] = await Promise.all([
    db.from('clientes').select('nome').eq('id', data.cliente_id).maybeSingle(),
    db.from('usuarios').select('nome, crea').eq('id', data.engenheiro_rt_id).maybeSingle(),
  ]);
  falha(erroCliente || erroRt);
  return {
    ...doBanco(data),
    clienteNome: cliente?.nome || '',
    engenheiroRT: rt ? `Eng. ${rt.nome}${rt.crea ? ` — CREA ${rt.crea}` : ''}` : '',
  };
}

async function lerRelacionados(rdoId) {
  const nomes = Object.entries(tabelas);
  const resultados = await Promise.all(nomes.map(([campo, tabela]) => {
    const consulta = db.from(tabela).select('*').eq('rdo_id', rdoId);
    return campo === 'fotos' ? consulta.order('numero') : consulta.order('ordem');
  }));
  const achouErro = resultados.find((r) => r.error);
  falha(achouErro?.error);
  const obj = {};
  nomes.forEach(([campo], index) => {
    obj[campo] = (resultados[index].data || []).map((linha) => {
      if (campo === 'fotos') return fotoParaApi(linha, rdoId);
      const item = doBanco(linha);
      delete item.rdoId;
      delete item.ordem;
      return item;
    });
  });
  const [{ data: assinaturas, error: erroAss }, { data: comentarios, error: erroCom }, { data: auditoria, error: erroAud }] = await Promise.all([
    db.from('assinaturas').select('*').eq('rdo_id', rdoId),
    db.from('comentarios').select('*').eq('rdo_id', rdoId).order('data_hora'),
    db.from('auditoria_rdo').select('*').eq('rdo_id', rdoId).order('data_hora'),
  ]);
  falha(erroAss || erroCom || erroAud);
  obj.assinaturas = { master: null, cliente: null };
  obj.assinaturaOperacional = null;
  for (const linha of assinaturas || []) {
    const assinatura = doBanco(linha);
    if (linha.papel === 'operacional') obj.assinaturaOperacional = assinatura;
    else obj.assinaturas[linha.papel] = assinatura;
  }
  obj.comentarios = (comentarios || []).map(doBanco);
  obj.auditoria = (auditoria || []).map(doBanco);
  return obj;
}

export async function carregarRdo(rdoId, usuario, { incluirPrivado = true } = {}) {
  const { data: linha, error } = await db.from('rdos').select('*').eq('id', rdoId).maybeSingle();
  falha(error);
  if (!linha) throw naoEncontrado('RDO');
  await consultarObra(linha.obra_id);
  if (usuario.perfil !== 'master') {
    const { data: vinculo, error: erroVinculo } = await db
      .from('obra_usuario').select('obra_id').eq('obra_id', linha.obra_id).eq('usuario_id', usuario.id).maybeSingle();
    falha(erroVinculo);
    if (!vinculo) throw naoEncontrado('RDO');
  }
  if (usuario.perfil === 'operacional' && linha.autor_id !== usuario.id && !incluirPrivado) throw naoEncontrado('RDO');
  if (usuario.perfil === 'cliente' && (!linha.liberado_ao_cliente_em || !['enviado_cliente', 'finalizado', 'retificado', 'cancelado'].includes(linha.status))) throw naoEncontrado('RDO');
  const relacionados = await lerRelacionados(rdoId);
  const rdo = { ...doBanco(linha), ...relacionados };
  delete rdo.idLocal;
  rdo.seguranca = { ...(rdo.seguranca || {}), incidentes: relacionados.incidentes };
  if (!incluirPrivado && usuario.perfil === 'cliente') {
    rdo.comentarios = rdo.comentarios.filter((item) => item.visibilidade === 'cliente');
    rdo.auditoria = rdo.auditoria.filter((item) => ['validacao', 'envio_cliente', 'ciencia_cliente', 'ressalva_cliente', 'esclarecimento_cliente', 'esclarecimento_respondido', 'finalizacao', 'retificacao'].includes(item.evento));
  }
  return rdo;
}

async function inserirAuditoria(rdo, evento, usuarioId, detalhe = null, meta = null) {
  const { error } = await db.from('auditoria_rdo').insert({
    rdo_id: rdo.id,
    evento,
    usuario_id: usuarioId,
    versao: rdo.versao,
    detalhe,
    meta,
    data_hora: new Date().toISOString(),
  });
  falha(error);
}

async function notificar({ usuarios, tipo, titulo, mensagem, rdo, prazo }) {
  const ativos = (usuarios || []).filter((u) => u.ativo !== false);
  if (!ativos.length) return;
  const linhas = ativos.map((u) => ({
    usuario_id: u.id,
    tipo,
    titulo,
    mensagem,
    obra_id: rdo.obraId,
    rdo_id: rdo.id,
    rdo_status: rdo.status,
    prazo: prazo || null,
    data_hora: new Date().toISOString(),
    lida: false,
    entregas: [],
  }));
  const { error } = await db.from('notificacoes').insert(linhas);
  falha(error);
}

async function usuariosDaObra(obraId, perfil) {
  const { data: vinculos, error } = await db.from('obra_usuario').select('usuario_id').eq('obra_id', obraId);
  falha(error);
  const ids = (vinculos || []).map((item) => item.usuario_id);
  if (!ids.length) return [];
  const { data, error: erroUsuarios } = await db.from('usuarios').select('id, nome, perfil, ativo, cliente_id').in('id', ids);
  falha(erroUsuarios);
  return (data || []).filter((item) => !perfil || item.perfil === perfil);
}

async function atualizarRdo(id, patch, statusEsperado) {
  let query = db.from('rdos').update(paraBanco(patch)).eq('id', id);
  if (statusEsperado) query = query.in('status', Array.isArray(statusEsperado) ? statusEsperado : [statusEsperado]);
  const { data, error } = await query.select('*').maybeSingle();
  falha(error);
  if (!data) {
    const atual = await db.from('rdos').select('id').eq('id', id).maybeSingle();
    falha(atual.error);
    if (!atual.data) throw naoEncontrado('RDO');
    throw comErro(409, 'TRANSICAO_INVALIDA', 'O RDO mudou de estado e não permite essa ação.');
  }
  return doBanco(data);
}

async function validarContexto(rdo) {
  const obra = await consultarObra(rdo.obraId);
  const { data: outros, error } = await db.from('rdos').select('id, obra_id, numero, data, turno, status').eq('obra_id', rdo.obraId);
  falha(error);
  return { obra, rdos: (outros || []).map(doBanco) };
}

async function gravarConteudoFilho(rdoId, campo, itens) {
  const tabela = tabelas[campo];
  if (!tabela) return;
  const { error: erroDelete } = await db.from(tabela).delete().eq('rdo_id', rdoId);
  falha(erroDelete);
  if (!itens?.length) return;
  const dados = itens.map((item, ordem) => {
    const linha = { ...paraBanco(item), rdo_id: rdoId, ordem };
    if (!linha.id) delete linha.id;
    delete linha.url;
    delete linha.envio;
    if (campo === 'ocorrencias' && !linha.codigo) linha.codigo = `OC-${String(ordem + 1).padStart(3, '0')}`;
    return linha;
  });
  const { error } = await db.from(tabela).insert(dados);
  falha(error);
}

export async function criarRdo({ obra, usuario, entrada }) {
  const idLocal = entrada.idLocal || null;
  if (idLocal) {
    const { data: existente, error } = await db.from('rdos').select('id').eq('autor_id', usuario.id).eq('id_local', idLocal).maybeSingle();
    falha(error);
    if (existente) return carregarRdo(existente.id, usuario);
  }
  const { data: anteriores, error: erroAnteriores } = await db.from('rdos').select('id, numero, data, turno, status').eq('obra_id', obra.id);
  falha(erroAnteriores);
  const duplicado = (anteriores || []).find((r) => r.data === entrada.data && r.turno === entrada.turno && !['cancelado', 'retificado'].includes(r.status));
  if (duplicado && !entrada.confirmarDuplicado)
    throw new ApiError(409, 'RDO_DUPLICADO', 'Já existe um RDO ativo para essa obra, data e turno.', { rdoId: duplicado.id, confirmarDuplicado: true });

  const { data: numero, error: erroNumero } = await db.rpc('proximo_numero_rdo', { p_obra: obra.id });
  falha(erroNumero);
  const agora = new Date().toISOString();
  let rdo = criarRdoVazio({ obra, autor: usuario, data: entrada.data, turno: entrada.turno, numero, versao: 1 });
  rdo = { ...rdo, id: randomUUID(), criadoEm: agora, atualizadoEm: agora, reaproveitadoDe: entrada.reaproveitarDe || null };
  if (entrada.reaproveitarDe) {
    const anterior = await carregarRdo(entrada.reaproveitarDe, usuario);
    if (anterior.obraId !== obra.id) throw naoEncontrado('RDO');
    rdo = reaproveitarDoAnterior(rdo, anterior);
  }
  const linha = paraBanco(rdo);
  for (const campo of Object.keys(tabelas)) delete linha[Object.keys(paraBanco({ [campo]: true }))[0]];
  delete linha.assinatura_operacional;
  delete linha.assinaturas;
  delete linha.comentarios;
  delete linha.auditoria;
  delete linha.fotos;
  delete linha.sync;
  delete linha.id_local;
  if (linha.seguranca) {
    linha.seguranca = { ...linha.seguranca };
    delete linha.seguranca.incidentes;
  }
  linha.id_local = idLocal;
  const { error } = await db.from('rdos').insert(linha);
  falha(error);
  for (const campo of Object.keys(tabelas)) {
    if (campo === 'incidentes') {
      if (rdo.seguranca?.incidentes?.length) await gravarConteudoFilho(rdo.id, campo, rdo.seguranca.incidentes);
    } else if (campo !== 'fotos' && rdo[campo]?.length) {
      await gravarConteudoFilho(rdo.id, campo, rdo[campo]);
    }
  }
  await inserirAuditoria(rdo, 'criacao', usuario.id, `RDO ${String(numero).padStart(4, '0')} criado.`);
  return carregarRdo(rdo.id, usuario);
}

export async function salvarConteudo(rdo, conteudo, usuario, manual = false, comoMaster = false) {
  if (comoMaster) {
    if (usuario.perfil !== 'master') throw new ApiError(403, 'PROIBIDO', 'Seu perfil não pode editar este RDO.');
    if (!['submetido', 'em_analise'].includes(rdo.status)) throw comErro(409, 'TRANSICAO_INVALIDA', 'Este RDO não está aberto para edição pelo master.');
  } else {
    if (rdo.autorId !== usuario.id) throw new ApiError(403, 'PROIBIDO', 'Só quem criou o RDO pode editar o conteúdo.');
    if (!['rascunho', 'devolvido'].includes(rdo.status)) throw comErro(409, 'TRANSICAO_INVALIDA', 'Este RDO não está aberto para edição.');
  }
  const patch = {};
  for (const campo of blocosCabecalho) if (Object.hasOwn(conteudo, campo)) patch[campo] = conteudo[campo];
  if (patch.seguranca) {
    patch.seguranca = { ...patch.seguranca };
    delete patch.seguranca.incidentes;
  }
  patch.atualizadoEm = new Date().toISOString();
  const { data: salvo, error } = await db
    .from('rdos')
    .update(paraBanco(patch))
    .eq('id', rdo.id)
    .eq('atualizado_em', rdo.atualizadoEm)
    .select('id')
    .maybeSingle();
  falha(error);
  if (!salvo)
    throw comErro(409, 'CONFLITO', 'Outra pessoa salvou este RDO antes. Atualize e tente novamente.');
  for (const campo of Object.keys(tabelas)) {
    if (campo === 'fotos') continue;
    if (campo === 'incidentes') continue;
    if (Object.hasOwn(conteudo, campo)) await gravarConteudoFilho(rdo.id, campo, conteudo[campo]);
  }
  if (Object.hasOwn(conteudo, 'seguranca'))
    await gravarConteudoFilho(rdo.id, 'incidentes', conteudo.seguranca?.incidentes || []);
  if (manual) await inserirAuditoria(rdo, 'rascunho_salvo', usuario.id, 'Rascunho salvo manualmente.');
  return carregarRdo(rdo.id, usuario);
}

export async function validarParaEnvio(rdo) {
  const { obra, rdos } = await validarContexto(rdo);
  const resultado = validarRdo(rdo, { obra, rdos, agora: new Date() });
  if (!resultado.valido) throw validacao(resultado.erros, `O RDO tem ${resultado.erros.length} erros que impedem o envio.`);
  return resultado;
}

export async function registrarEvento(rdo, evento, usuario, detalhe) {
  await inserirAuditoria(rdo, evento, usuario.id, detalhe);
}

export async function mudarEstado(rdo, status, usuario, extra = {}, statusAtual) {
  await atualizarRdo(rdo.id, { ...extra, status, atualizadoEm: new Date().toISOString() }, statusAtual || rdo.status);
  return carregarRdo(rdo.id, usuario);
}

export async function notificarMasters(rdo, tipo, titulo, mensagem, prazo) {
  const { data, error } = await db.from('usuarios').select('id, ativo').eq('perfil', 'master');
  falha(error);
  await notificar({ usuarios: data, tipo, titulo, mensagem, rdo, prazo });
}

export async function notificarAutor(rdo, tipo, titulo, mensagem, prazo) {
  const { data, error } = await db.from('usuarios').select('id, ativo').eq('id', rdo.autorId).maybeSingle();
  falha(error);
  await notificar({ usuarios: data ? [data] : [], tipo, titulo, mensagem, rdo, prazo });
}

export async function notificarClientes(rdo, tipo, titulo, mensagem, prazo) {
  const usuarios = await usuariosDaObra(rdo.obraId, 'cliente');
  await notificar({ usuarios, tipo, titulo, mensagem, rdo, prazo });
}

export async function atualizarHash(rdo) {
  const hashTecnico = hashOf(conteudoTecnico(rdo));
  const { error } = await db.from('rdos').update({ hash_tecnico: hashTecnico }).eq('id', rdo.id);
  falha(error);
  return hashTecnico;
}

export async function guardarAssinatura(rdoId, usuario, assinatura, papel, extra = {}) {
  const base = {
    rdo_id: rdoId,
    papel,
    usuario_id: usuario.id,
    nome: usuario.nome,
    data_hora: extra.dataHora || new Date().toISOString(),
    versao: extra.versao,
    tipo: extra.tipo || null,
    texto: extra.texto || null,
    ip: extra.ip || null,
    dispositivo: extra.dispositivo || null,
    metodo_2fa: extra.metodo2fa || null,
    declaracao: extra.declaracao || null,
    hash: extra.hash || null,
    tracos: assinatura.tracos || [],
    largura: assinatura.largura || null,
    altura: assinatura.altura || null,
  };
  const { error } = await db.from('assinaturas').insert(base);
  falha(error);
  return doBanco(base);
}

export async function confirmarSegundoFator(usuario, codigo) {
  if (!/^\d{6}$/.test(String(codigo || ''))) throw new ApiError(401, 'CODIGO_INVALIDO', 'O código de confirmação está incorreto.');
  const authCliente = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authCliente.auth.verifyOtp({ email: usuario.email, token: String(codigo), type: 'email' });
  if (error || !data?.user || data.user.id !== usuario.auth_id)
    throw new ApiError(401, 'CODIGO_INVALIDO', 'O código expirou ou não corresponde à sua conta.');
  return data.user;
}

export function textoDeclaracaoMaster(rdo) {
  return declaracaoMaster(String(rdo.numero).padStart(4, '0'), rdo.versao);
}

export function textoDeclaracaoCliente(rdo, tipo) {
  return declaracaoCliente(tipo, String(rdo.numero).padStart(4, '0'), rdo.versao);
}

export async function finalizarHashCliente(rdo, assinatura) {
  const hashFinal = hashOf({
    tecnico: rdo.hashTecnico,
    master: rdo.assinaturas?.master?.dataHora,
    cliente: assinatura.dataHora,
    tipo: assinatura.tipo,
    texto: assinatura.tipo === 'ressalva' ? assinatura.texto || '' : '',
  });
  const { error } = await db.from('rdos').update({ hash_final: hashFinal }).eq('id', rdo.id);
  falha(error);
  return hashFinal;
}

export async function adicionarFoto(rdo, usuario, arquivo, campos) {
  if (!['image/jpeg', 'image/png', 'image/heic'].includes(arquivo.mimetype))
    throw validacao({ arquivo: 'Envie uma imagem JPEG, PNG ou HEIC.' });
  if (arquivo.size > 10 * 1024 * 1024) throw new ApiError(413, 'ARQUIVO_GRANDE', 'A foto deve ter até 10 MB.');
  const { data: ultima, error: erroUltima } = await db.from('fotos').select('numero').eq('rdo_id', rdo.id).order('numero', { ascending: false }).limit(1).maybeSingle();
  falha(erroUltima);
  const fotoId = randomUUID();
  const storagePath = `${rdo.obraId}/${rdo.id}/${fotoId}.${arquivo.mimetype === 'image/png' ? 'png' : arquivo.mimetype === 'image/heic' ? 'heic' : 'jpg'}`;
  const { error: erroUpload } = await db.storage.from(config.bucketFotos).upload(storagePath, arquivo.buffer, { contentType: arquivo.mimetype, upsert: false });
  falha(erroUpload);
  const linha = {
    id: fotoId, rdo_id: rdo.id, numero: (ultima?.numero || 0) + 1, storage_path: storagePath,
    legenda: campos.legenda || '', local: campos.local || null,
    vinculo_tipo: campos.vinculoTipo || null, vinculo_id: campos.vinculoId || null,
    autor_id: usuario.id, data_hora: new Date().toISOString(),
    latitude: campos.latitude ? Number(campos.latitude) : null, longitude: campos.longitude ? Number(campos.longitude) : null,
    largura: campos.largura ? Number(campos.largura) : null, altura: campos.altura ? Number(campos.altura) : null,
    compressao: campos.compressao ? Number(campos.compressao) : null,
  };
  const { error } = await db.from('fotos').insert(linha);
  if (error) {
    await db.storage.from(config.bucketFotos).remove([storagePath]);
    throw erroDoBanco(error);
  }
  return fotoParaApi(linha, rdo.id);
}

export { fotoParaApi };

export async function validarEdicaoFoto(rdo, usuario) {
  if (rdo.autorId !== usuario.id || !['rascunho', 'devolvido'].includes(rdo.status))
    throw comErro(409, 'TRANSICAO_INVALIDA', 'As fotos só podem ser alteradas pelo autor enquanto o RDO está aberto.');
}

export async function buscarFoto(rdoId, fotoId) {
  const { data, error } = await db.from('fotos').select('*').eq('id', fotoId).eq('rdo_id', rdoId).maybeSingle();
  falha(error);
  if (!data) throw naoEncontrado('Foto');
  return data;
}

export async function apagarFoto(foto) {
  if (foto.storage_path) {
    const { error } = await db.storage.from(config.bucketFotos).remove([foto.storage_path]);
    falha(error);
  }
  const { error } = await db.from('fotos').delete().eq('id', foto.id);
  falha(error);
}

export async function enviarArquivo(foto) {
  if (!foto.storage_path) throw naoEncontrado('Arquivo');
  const { data, error } = await db.storage.from(config.bucketFotos).download(foto.storage_path);
  falha(error);
  return data;
}

export async function criarNovaVersao(rdo, usuario, motivo) {
  if (!motivo?.trim()) throw validacao({ motivo: 'Informe o motivo da retificação.' });
  if (!['validado', 'enviado_cliente', 'finalizado'].includes(rdo.status)) throw comErro(409, 'TRANSICAO_INVALIDA', 'Este RDO não pode ser retificado neste estado.');
  let nova = {
    ...rdo,
    id: randomUUID(),
    versao: rdo.versao + 1,
    status: 'rascunho',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    retificaDe: rdo.id,
    retificadoPor: null,
    motivoRetificacao: motivo.trim(),
    declaracao: { aceita: false, dataHora: null },
    submetidoEm: null,
    devolucao: null,
    esclarecimentoPendente: false,
    assinaturas: { master: null, cliente: null },
    hashTecnico: null,
    hashFinal: null,
    liberadoAoClienteEm: null,
    finalizadoEm: null,
    cancelamento: null,
    comentarios: [],
    auditoria: [],
    fotos: [],
  };
  const cabecalho = paraBanco(nova);
  for (const campo of Object.keys(tabelas)) delete cabecalho[Object.keys(paraBanco({ [campo]: true }))[0]];
  for (const campo of ['assinaturaOperacional', 'assinaturas', 'comentarios', 'auditoria', 'sync', 'reaproveitadoDe']) delete cabecalho[Object.keys(paraBanco({ [campo]: true }))[0]];
  delete cabecalho.idLocal;
  if (cabecalho.seguranca) {
    cabecalho.seguranca = { ...cabecalho.seguranca };
    delete cabecalho.seguranca.incidentes;
  }
  const { error } = await db.from('rdos').insert(cabecalho);
  falha(error);
  for (const campo of Object.keys(tabelas)) {
    if (campo === 'fotos') {
      const { data: fotos, error: erroFotos } = await db.from('fotos').select('*').eq('rdo_id', rdo.id).order('numero');
      falha(erroFotos);
      if (fotos?.length) {
        const copias = fotos.map(({ id, rdo_id, ...foto }) => ({ ...foto, id: randomUUID(), rdo_id: nova.id }));
        const { error: erroCopia } = await db.from('fotos').insert(copias);
        falha(erroCopia);
      }
    } else {
      const itens = campo === 'incidentes' ? rdo.seguranca?.incidentes || [] : rdo[campo] || [];
      await gravarConteudoFilho(nova.id, campo, itens);
    }
  }
  await atualizarRdo(rdo.id, { status: 'retificado', atualizadoEm: new Date().toISOString(), retificadoPor: nova.id }, rdo.status);
  const retorno = await carregarRdo(nova.id, usuario);
  await inserirAuditoria(rdo, 'retificacao', usuario.id, motivo.trim());
  await inserirAuditoria(retorno, 'retificacao', usuario.id, motivo.trim());
  return retorno;
}
