import { env } from '../../config/env.js';
import { ApiError } from './client.js';
import { montarUploadFoto } from './upload.js';
import { selecionar, conteudoParaApi, assinaturaParaApi, rdoParaTela } from './payloads.js';

export const acoesLocais = new Set([
  'definirBiometria',
  'sincronizarPendentes',
  'processarLembretes',
  'resetarDemo',
  'verificarCodigo',
]);
const publicas = new Set(['entrar', 'solicitarRecuperacao', 'redefinirSenha']);
const id = (valor) => {
  if (!valor)
    throw new ApiError({ status: 422, codigo: 'CAMPO_OBRIGATORIO', mensagem: 'Informe o identificador do registro.' });
  return encodeURIComponent(valor);
};
const rota = (method, path, body, tipo) => ({ method, path, body, tipo });
const escritaRdo =
  (sufixo, campos = [], method = 'POST') =>
  (args) =>
    rota(method, `/rdos/${id(args.rdoId)}/${sufixo}`, campos.length ? selecionar(args, campos) : undefined, 'rdo');

function cadastro(args, state, campo, colecao, path, campos) {
  const item = args[campo] || {};
  const existe = state[colecao]?.some((atual) => atual.id === item.id);
  return rota(existe ? 'PUT' : 'POST', existe ? `${path}/${id(item.id)}` : path, selecionar(item, campos), colecao);
}

export const rotasRemotas = {
  entrar: (a) =>
    rota('POST', '/auth/login', { email: a.email?.trim().toLowerCase(), senha: a.senha, manter: !!a.manter }),
  sair: () => rota('POST', '/auth/logout'),
  restaurarSessao: () => rota('GET', '/auth/sessao'),
  solicitarRecuperacao: (a) => rota('POST', '/auth/recuperacao', { email: a.email?.trim().toLowerCase() }),
  redefinirSenha: (a) =>
    rota('POST', '/auth/recuperacao/confirmar', { email: a.email, codigo: a.codigo, novaSenha: a.senha }),
  alterarSenha: (a) => rota('POST', '/auth/senha', { senhaAtual: a.senhaAtual, novaSenha: a.senha }),
  aceitarTermos: (a) =>
    rota('POST', '/usuarios/me/termos', { versaoTermos: a.versaoTermos || '1.0', opcoes: a.opcoes || {} }),
  criarRdo: (a) =>
    rota(
      'POST',
      `/obras/${id(a.obraId)}/rdos`,
      selecionar(a, ['data', 'turno', 'reaproveitarDe', 'idLocal', 'confirmarDuplicado']),
      'rdo',
    ),
  salvarRdo: (a, s) =>
    rota(
      'PUT',
      `/rdos/${id(a.rdo?.id)}/conteudo`,
      {
        conteudo: conteudoParaApi(a.rdo),
        atualizadoEm:
          s.rdos?.find((r) => r.id === a.rdo.id)?.sync?.atualizadoEmServidor ||
          a.rdo.sync?.atualizadoEmServidor ||
          a.rdo.atualizadoEm,
        manual: !!a.manual,
      },
      'rdo',
    ),
  submeterRdo: escritaRdo('submeter'),
  registrarVisualizacao: (a) => rota('POST', `/rdos/${id(a.rdoId)}/visualizacoes`),
  iniciarAnalise: escritaRdo('analise'),
  devolverRdo: escritaRdo('devolucao', ['motivo', 'prazo', 'contexto']),
  editarComoMaster: (a) =>
    rota(
      'PUT',
      `/rdos/${id(a.rdoId)}/edicao-master`,
      {
        conteudo: conteudoParaApi(a.novo),
        justificativa: a.justificativa,
        alteracoes: a.alteracoes,
      },
      'rdo',
    ),
  validarEAssinar: (a) =>
    rota(
      'POST',
      `/rdos/${id(a.rdoId)}/validacao`,
      {
        assinatura: assinaturaParaApi(a.assinatura),
        enviarAgora: a.enviarAgora ?? true,
        canais: a.canais,
      },
      'rdo',
    ),
  enviarAoCliente: escritaRdo('envio-cliente', ['canais']),
  reenviarNotificacaoCliente: escritaRdo('envio-cliente/reenvio'),
  assinarComoCliente: (a) =>
    rota(
      'POST',
      `/rdos/${id(a.rdoId)}/manifestacao`,
      {
        tipo: a.tipo,
        texto: a.texto || '',
        assinatura: assinaturaParaApi(a.assinatura),
      },
      'rdo',
    ),
  retificarRdo: escritaRdo('retificacao', ['motivo']),
  cancelarRdo: escritaRdo('cancelamento', ['motivo']),
  excluirRdo: (a) => rota('POST', `/rdos/${id(a.rdoId)}/exclusao`, { motivo: a.motivo }),
  registrarPdf: escritaRdo('pdf'),
  comentarRdo: (a) =>
    rota(
      'POST',
      `/rdos/${id(a.rdoId)}/comentarios`,
      selecionar(a, ['texto', 'contexto', 'contextoRef', 'visibilidade']),
      'comentario',
    ),
  enviarFoto: (a) => rota('POST', `/rdos/${id(a.rdoId)}/fotos`, undefined, 'foto'),
  marcarNotificacaoLida: (a) => rota('PATCH', `/notificacoes/${id(a.id)}`, { lida: true }, 'notifications'),
  marcarTodasLidas: () => rota('POST', '/notificacoes/marcar-todas-lidas'),
  reenviarEntrega: (a) => rota('POST', `/notificacoes/${id(a.notificacaoId)}/reenvio`, undefined, 'notifications'),
  salvarObra: (a, s) =>
    cadastro(a, s, 'obra', 'obras', '/obras', [
      'nome',
      'descricao',
      'contrato',
      'os',
      'clienteId',
      'endereco',
      'inicio',
      'inicioRegistro',
      'fim',
      'engenheiroRTId',
      'diasUteis',
      'exigeAssinaturaOperacional',
      'status',
      'usuarioIds',
    ]),
  salvarUsuario: (a, s) => {
    const r = cadastro(a, s, 'usuario', 'users', '/usuarios', [
      'nome',
      'email',
      'perfil',
      'cargo',
      'telefone',
      'clienteId',
      'crea',
      'canais',
      'obraIds',
    ]);
    if (a.obraIds) r.body.obraIds = a.obraIds;
    return r;
  },
  alternarUsuarioAtivo: (a, s) => {
    const usuario = s.users?.find((u) => u.id === a.id);
    if (!usuario && a.ativo === undefined) throw new ApiError({ status: 404, mensagem: 'Usuário não encontrado.' });
    return rota('PATCH', `/usuarios/${id(a.id)}/ativo`, { ativo: a.ativo ?? !usuario.ativo }, 'users');
  },
  atualizarCanais: (a) => rota('PATCH', '/usuarios/me/canais', selecionar(a.canais, ['push', 'email', 'whatsapp'])),
  salvarCliente: (a, s) => cadastro(a, s, 'cliente', 'clientes', '/clientes', ['nome', 'contato', 'email', 'telefone']),
  salvarEmpresa: (a) =>
    rota(
      'PUT',
      '/empresa',
      selecionar(a.empresa, [
        'nome',
        'razaoSocial',
        'nomeFantasia',
        'cnpj',
        'logo',
        'logoUrl',
        'endereco',
        'cidade',
        'telefone',
        'email',
        'site',
        'responsavel',
      ]),
      'empresa',
    ),
  salvarCatalogo: (a) => rota('PUT', `/catalogos/${id(a.chave)}`, { lista: a.lista }),
  atualizarConfiguracoes: (a) =>
    rota('PATCH', '/configuracoes', selecionar(a.patch, ['inatividadeMin', 'lembretes']), 'settings'),
  registrarExportacao: (a) =>
    rota('POST', '/exportacoes', selecionar(a.arquivo, ['nome', 'tipo', 'descricao']), 'files'),
  salvarAvaliacao: (a) =>
    rota(
      'PUT',
      `/academico/grupos/${id(a.grupoId)}/entregas/${id(a.faseId)}/avaliacao`,
      {
        notas: Object.fromEntries(
          Object.entries(a.notas || {}).map(([key, value]) => [key, Number(String(value).replace(',', '.'))]),
        ),
        comentario: a.comentario,
      },
      'academico',
    ),
  registrarEntregaAcademica: (a) =>
    rota('POST', `/academico/grupos/${id(a.grupoId)}/entregas/${id(a.faseId)}/versoes`, undefined, 'academico'),
};

function prefixo() {
  return /\/api\/v1\/?$/.test(env.API_URL) ? '' : '/api/v1';
}

async function listar(request, path, options) {
  const itens = [];
  let pagina = 1;
  while (true) {
    const dados = await request(`${prefixo()}${path}?pagina=${pagina}&porPagina=100`, options);
    if (Array.isArray(dados)) return dados;
    if (!Array.isArray(dados?.itens))
      throw new ApiError({ codigo: 'RESPOSTA_INVALIDA', mensagem: 'O servidor não enviou a lista solicitada.' });
    itens.push(...dados.itens);
    if (itens.length >= dados.total || !dados.itens.length) return itens;
    if (pagina >= 1000)
      throw new ApiError({ codigo: 'RESPOSTA_INVALIDA', mensagem: 'A paginação do servidor não foi concluída.' });
    pagina++;
  }
}

async function carregarDados(request, usuario, token, headers) {
  const options = {
    headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(token ? { autenticado: false } : {}),
  };
  const ler = (path) => request(`${prefixo()}${path}`, options);
  const [obras, resumos, notifications, empresa, clientes, catalogos, settings] = await Promise.all([
    listar(request, '/obras', options),
    listar(request, '/rdos', options),
    listar(request, '/notificacoes', options),
    ler('/empresa'),
    listar(request, '/clientes', options),
    ler('/catalogos'),
    ler('/configuracoes'),
  ]);
  const rdos = await Promise.all(resumos.map((r) => ler(`/rdos/${id(r.id)}`).then(rdoParaTela)));
  const alteracoes = {
    obras,
    rdos,
    notifications,
    empresa,
    clientes,
    catalogos,
    settings,
    users: [usuario],
    auditoriaGlobal: [],
    academico: { grupos: [], criterios: [], fases: [] },
  };
  if (usuario.perfil === 'master') {
    [alteracoes.users, alteracoes.academico, alteracoes.auditoriaGlobal] = await Promise.all([
      listar(request, '/usuarios', options),
      ler('/academico'),
      listar(request, '/auditoria', options),
    ]);
  }
  return alteracoes;
}

export async function executarRemoto(nome, args = {}, { request, itemId, getState = () => ({}), token } = {}) {
  if (nome === 'verificarCodigo') {
    if (!/^\d{6}$/.test(args.codigo || ''))
      throw new ApiError({ status: 422, codigo: 'CODIGO_INVALIDO', mensagem: 'Digite os 6 dígitos do código.' });
    // O contrato verifica o código junto com a nova senha, em /auth/recuperacao/confirmar.
    return { email: args.email, codigo: args.codigo, confirmacaoPendente: true };
  }
  if (!rotasRemotas[nome])
    throw new ApiError({ codigo: 'ACAO_SEM_ROTA', mensagem: `A ação ${nome} não tem rota remota.` });
  if (!request) throw new ApiError({ codigo: 'CONFIGURACAO', mensagem: 'O cliente HTTP não foi configurado.' });
  const state = getState();
  const r = rotasRemotas[nome](args, state);
  if (nome === 'enviarFoto') r.body = await montarUploadFoto(args.foto);
  if (nome === 'registrarEntregaAcademica') {
    const arquivo = typeof args.arquivo === 'object' ? args.arquivo : { nome: args.arquivo };
    if (!arquivo?.uri)
      throw new ApiError({
        status: 422,
        codigo: 'ARQUIVO_INDISPONIVEL',
        mensagem: 'Selecione o arquivo para enviar a entrega.',
      });
    r.body = await montarUploadFoto(arquivo, { metadados: false });
    r.body.append('comentario', args.comentario || '');
  }
  const headers = {
    ...(state.session?.deviceId ? { 'X-Device-Id': state.session.deviceId } : {}),
    'X-Device-Label': state.session?.deviceLabel || 'RDO Mobile',
    ...(itemId ? { 'Idempotency-Key': itemId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const leitura = { headers: selecionar(headers, ['X-Device-Id', 'X-Device-Label']) };
  const dados = await request(`${prefixo()}${r.path}`, {
    method: r.method,
    body: r.body,
    headers,
    autenticado: !publicas.has(nome) && nome !== 'sair',
  });
  if (nome === 'entrar' || nome === 'restaurarSessao') {
    if (!dados?.usuario?.id || (nome === 'entrar' && !dados.token))
      throw new ApiError({ codigo: 'RESPOSTA_INVALIDA', mensagem: 'O servidor não confirmou a sessão.' });
    const alteracoes = await carregarDados(request, dados.usuario, dados.token, leitura.headers);
    return {
      ...dados,
      alteracoes,
      substituir: ['obras', 'rdos', 'notifications', 'clientes', 'users', 'auditoriaGlobal'],
    };
  }
  if (nome === 'aceitarTermos') return { aceite: dados };
  if (nome === 'solicitarRecuperacao' || nome === 'redefinirSenha' || nome === 'alterarSenha' || nome === 'sair')
    return { ok: true };
  if (r.tipo === 'rdo') {
    if (!dados?.id)
      throw new ApiError({ codigo: 'RESPOSTA_INVALIDA', mensagem: 'O servidor não devolveu o RDO atualizado.' });
    const rdos = [rdoParaTela(dados)];
    if (nome === 'retificarRdo') rdos.push(rdoParaTela(await request(`${prefixo()}/rdos/${id(args.rdoId)}`, leitura)));
    return { alteracoes: { rdos } };
  }
  if (nome === 'excluirRdo') return { removidos: { rdos: [args.rdoId] } };
  if (nome === 'comentarRdo' || nome === 'enviarFoto') {
    const rdo = await request(`${prefixo()}/rdos/${id(args.rdoId)}`, leitura);
    if (!rdo?.id)
      throw new ApiError({ codigo: 'RESPOSTA_INVALIDA', mensagem: 'O servidor não devolveu o RDO atualizado.' });
    if (nome === 'enviarFoto')
      rdo.fotos = rdo.fotos.map((foto) => (foto.id === dados?.id ? { ...foto, idLocal: args.foto.id } : foto));
    return { alteracoes: { rdos: [rdoParaTela(rdo)] } };
  }
  if (nome === 'marcarTodasLidas')
    return { alteracoes: { notifications: await listar(request, '/notificacoes', leitura) } };
  if (nome === 'atualizarCanais') {
    const usuario = state.users?.find((u) => u.id === state.session?.userId);
    return { alteracoes: { users: [{ ...usuario, canais: { ...usuario?.canais, ...dados?.canais } }] } };
  }
  if (nome === 'salvarCatalogo')
    return { alteracoes: { catalogos: { ...state.catalogos, [dados.chave]: dados.lista } } };
  if (r.tipo === 'academico') return { alteracoes: { academico: await request(`${prefixo()}/academico`, leitura) } };
  if (r.tipo === 'settings') return { alteracoes: { settings: dados || args.patch } };
  if (r.tipo) return { alteracoes: { [r.tipo]: Array.isArray(state[r.tipo]) ? [dados] : dados } };
  return {};
}
