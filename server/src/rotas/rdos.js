import { Router } from 'express';
import { autenticar, exigirPerfil } from '../middleware/autenticar.js';
import { db } from '../supabase.js';
import { ApiError, erroDoBanco, naoEncontrado, validacao } from '../erros.js';
import { doBanco, paraBanco } from '../mapear.js';
import { validarRdo } from '../../../src/domain/validation.js';
import {
  adicionarFoto, apagarFoto, atualizarHash, buscarFoto, carregarRdo, confirmarSegundoFator, criarNovaVersao,
  finalizarHashCliente, fotoParaApi,
  enviarArquivo, guardarAssinatura, mudarEstado, notificarAutor, notificarClientes,
  notificarMasters, registrarEvento, salvarConteudo, textoDeclaracaoCliente, textoDeclaracaoMaster,
  validarEdicaoFoto, validarParaEnvio,
} from './rdo-service.js';

export const router = Router();
router.use(autenticar);

async function rdoDaRota(req) {
  return carregarRdo(req.params.id, req.usuario, { incluirPrivado: req.usuario.perfil !== 'cliente' });
}

function exigePerfil(usuario, ...perfis) {
  if (!perfis.includes(usuario.perfil)) throw new ApiError(403, 'PROIBIDO', 'Seu perfil não pode fazer esta ação.');
}

async function arquivoFoto(req, _res, next) {
  try {
    if (!req.is('multipart/form-data')) throw validacao({ arquivo: 'Envie a foto como multipart/form-data.' });
    const bruto = await new Promise((resolve, reject) => {
      const partes = [];
      let tamanho = 0;
      let passouDoLimite = false;
      req.on('data', (parte) => {
        tamanho += parte.length;
        if (tamanho > 11 * 1024 * 1024) {
          passouDoLimite = true;
          return;
        }
        partes.push(parte);
      });
      req.on('end', () => {
        if (passouDoLimite) reject(new ApiError(413, 'ARQUIVO_GRANDE', 'A foto deve ter até 10 MB.'));
        else resolve(Buffer.concat(partes));
      });
      req.on('error', reject);
    });
    const form = await new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': req.get('content-type') },
      body: bruto,
    }).formData();
    const enviado = form.get('arquivo');
    if (!enviado || typeof enviado.arrayBuffer !== 'function') throw validacao({ arquivo: 'Selecione uma foto.' });
    req.arquivoFoto = {
      buffer: Buffer.from(await enviado.arrayBuffer()),
      mimetype: enviado.type,
      size: enviado.size,
    };
    req.camposFoto = Object.fromEntries([...form.entries()].filter(([chave]) => chave !== 'arquivo'));
    next();
  } catch (error) {
    next(error);
  }
}

router.get('/rdos', async (req, res, next) => {
  try {
    let query = db.from('rdos').select('*', { count: 'exact' }).order('data', { ascending: req.query.ordem !== '-data' });
    if (req.usuario.perfil !== 'master') {
      const { data: vinculos, error } = await db.from('obra_usuario').select('obra_id').eq('usuario_id', req.usuario.id);
      if (error) throw erroDoBanco(error);
      const ids = (vinculos || []).map((item) => item.obra_id);
      if (!ids.length) return res.json({ itens: [], total: 0, pagina: 1, porPagina: 20 });
      query = query.in('obra_id', ids);
      if (req.usuario.perfil === 'operacional') query = query.or(`autor_id.eq.${req.usuario.id},status.in.(submetido,em_analise,devolvido,validado,enviado_cliente,finalizado,retificado,cancelado)`);
      if (req.usuario.perfil === 'cliente') query = query.in('status', ['enviado_cliente', 'finalizado', 'retificado', 'cancelado']);
    }
    if (req.query.obraId) query = query.eq('obra_id', req.query.obraId);
    if (req.query.de) query = query.gte('data', req.query.de);
    if (req.query.ate) query = query.lte('data', req.query.ate);
    if (req.query.autorId) query = query.eq('autor_id', req.query.autorId);
    if (req.query.numero) query = query.eq('numero', Number(req.query.numero));
    if (req.query.status) query = query.in('status', String(req.query.status).split(','));
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const porPagina = Math.min(100, Math.max(1, Number(req.query.porPagina) || 20));
    const inicio = (pagina - 1) * porPagina;
    const { data, error, count } = await query.range(inicio, inicio + porPagina - 1);
    if (error) throw erroDoBanco(error);
    const itens = await Promise.all((data || []).map(async (linha) => {
      const rdo = await carregarRdo(linha.id, req.usuario, { incluirPrivado: false });
      return {
        id: rdo.id, obraId: rdo.obraId, numero: rdo.numero, versao: rdo.versao,
        data: rdo.data, turno: rdo.turno, status: rdo.status, autorId: rdo.autorId,
        atualizadoEm: rdo.atualizadoEm, submetidoEm: rdo.submetidoEm,
        esclarecimentoPendente: rdo.esclarecimentoPendente, devolucao: rdo.devolucao,
        totalTrabalhadores: rdo.maoDeObra.reduce((n, item) => n + Number(item.quantidade || 0), 0),
        totalFotos: rdo.fotos.length, totalOcorrencias: rdo.ocorrencias.length,
      };
    }));
    res.json({ itens, total: count || 0, pagina, porPagina });
  } catch (error) {
    next(error);
  }
});

router.get('/rdos/:id', async (req, res, next) => {
  try {
    res.json(await rdoDaRota(req));
  } catch (error) {
    next(error);
  }
});

router.get('/rdos/:id/validacao', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    if (req.usuario.perfil === 'operacional' && rdo.autorId !== req.usuario.id) throw naoEncontrado('RDO');
    const obra = await db.from('obras').select('*').eq('id', rdo.obraId).maybeSingle();
    if (obra.error) throw erroDoBanco(obra.error);
    const regra = validarRdo(rdo, { obra: doBanco(obra.data), agora: new Date() });
    res.json({ valido: regra.valido, erros: regra.erros, avisos: regra.avisos, porPasso: regra.porPasso, progresso: regra.progresso });
  } catch (error) {
    next(error);
  }
});

router.put('/rdos/:id/conteudo', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    const atualizadoEm = req.body?.atualizadoEm;
    if (atualizadoEm && atualizadoEm !== rdo.atualizadoEm)
      throw new ApiError(409, 'CONFLITO', 'Outra pessoa salvou este RDO antes. Atualize e tente novamente.');
    const salvo = await salvarConteudo(rdo, req.body?.conteudo || {}, req.usuario, req.body?.manual === true);
    res.json(salvo);
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/submeter', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    if (rdo.autorId !== req.usuario.id) throw new ApiError(403, 'PROIBIDO', 'Só quem criou o RDO pode enviá-lo.');
    if (!['rascunho', 'devolvido'].includes(rdo.status)) throw new ApiError(409, 'TRANSICAO_INVALIDA', 'Este RDO não pode ser enviado neste estado.');
    await validarParaEnvio(rdo);
    const agora = new Date().toISOString();
    const atualizado = await mudarEstado(rdo, 'submetido', req.usuario, { submetidoEm: agora, declaracao: { ...rdo.declaracao, dataHora: agora }, devolucao: null });
    await registrarEvento(rdo, rdo.status === 'devolvido' ? 'correcao_reenvio' : 'submissao', req.usuario, 'RDO submetido para análise.');
    const prazo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await notificarMasters(atualizado, 'rdo_submetido', 'RDO aguardando análise', `RDO ${String(rdo.numero).padStart(4, '0')} enviado para análise.`, prazo);
    res.json(atualizado);
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/analise', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'master');
    const rdo = await rdoDaRota(req);
    if (rdo.status === 'em_analise') return res.status(409).json({ codigo: 'TRANSICAO_INVALIDA', mensagem: 'Este RDO já está em análise.' });
    const atualizado = await mudarEstado(rdo, 'em_analise', req.usuario, {}, 'submetido');
    await registrarEvento(rdo, 'analise_iniciada', req.usuario, 'Análise iniciada pelo master.');
    res.json(atualizado);
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/devolucao', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'master');
    const rdo = await rdoDaRota(req);
    const motivo = String(req.body?.motivo || '').trim();
    if (!motivo) throw validacao({ motivo: 'Informe o motivo da devolução.' });
    const agora = new Date().toISOString();
    const atualizado = await mudarEstado(rdo, 'devolvido', req.usuario, { devolucao: { motivo, prazo: req.body?.prazo || null, por: req.usuario.id, em: agora } }, ['submetido', 'em_analise']);
    const { error } = await db.from('comentarios').insert({ rdo_id: rdo.id, autor_id: req.usuario.id, papel: 'master', tipo: 'devolucao', contexto: req.body?.contexto || 'geral', texto: motivo, data_hora: agora, visibilidade: 'interno' });
    if (error) throw erroDoBanco(error);
    await registrarEvento(rdo, 'devolucao', req.usuario, motivo);
    await notificarAutor(atualizado, 'rdo_devolvido', 'RDO devolvido para ajustes', motivo, req.body?.prazo);
    res.json(await rdoDaRota(req));
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/validacao', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'master');
    const rdo = await rdoDaRota(req);
    if (!['submetido', 'em_analise'].includes(rdo.status)) throw new ApiError(409, 'TRANSICAO_INVALIDA', 'Este RDO não pode ser validado neste estado.');
    if (!req.body?.assinatura?.tracos) throw validacao({ assinatura: 'Faça a assinatura antes de validar.' });
    if (!req.body?.assinatura?.segundoFator) throw validacao({ assinatura: 'Confirme sua identidade com o segundo fator.' });
    await validarParaEnvio(rdo);
    await confirmarSegundoFator(req.usuario, req.body.assinatura.segundoFator.codigo);
    const hash = await atualizarHash(rdo);
    const assinatura = await guardarAssinatura(rdo.id, req.usuario, req.body.assinatura, 'master', {
      versao: rdo.versao,
      ip: req.ip,
      dispositivo: req.get('X-Device-Label') || null,
      metodo2fa: 'otp',
      declaracao: textoDeclaracaoMaster(rdo),
      hash,
    });
    let atualizado = await mudarEstado(rdo, 'validado', req.usuario, {}, ['submetido', 'em_analise']);
    await registrarEvento(rdo, 'validacao', req.usuario, `Versão técnica fechada. Hash ${hash.slice(0, 16)}…`);
    await notificarAutor(atualizado, 'sistema', 'RDO validado', `RDO ${String(rdo.numero).padStart(4, '0')} foi validado.`);
    if (req.body.enviarAgora) {
      atualizado = await mudarEstado(atualizado, 'enviado_cliente', req.usuario, { liberadoAoClienteEm: new Date().toISOString() }, 'validado');
      await registrarEvento(atualizado, 'envio_cliente', req.usuario, 'RDO liberado para o cliente.');
      await notificarClientes(atualizado, 'rdo_validado', 'Novo RDO disponível', `RDO ${String(rdo.numero).padStart(4, '0')} liberado para consulta.`);
    }
    res.json(await carregarRdo(rdo.id, req.usuario));
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/envio-cliente', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'master');
    const rdo = await rdoDaRota(req);
    const atualizado = await mudarEstado(rdo, 'enviado_cliente', req.usuario, { liberadoAoClienteEm: new Date().toISOString() }, 'validado');
    await registrarEvento(rdo, 'envio_cliente', req.usuario, 'RDO liberado para o cliente.');
    await notificarClientes(atualizado, 'rdo_validado', 'Novo RDO disponível', `RDO ${String(rdo.numero).padStart(4, '0')} liberado para consulta.`);
    res.json(atualizado);
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/envio-cliente/reenvio', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'master');
    const rdo = await rdoDaRota(req);
    if (rdo.status !== 'enviado_cliente') throw new ApiError(409, 'TRANSICAO_INVALIDA', 'Este RDO ainda não foi liberado ao cliente.');
    await registrarEvento(rdo, 'envio_cliente', req.usuario, 'Notificação ao cliente reenviada.');
    await notificarClientes(rdo, 'rdo_validado', 'RDO disponível', `RDO ${String(rdo.numero).padStart(4, '0')} está disponível para consulta.`);
    res.json(rdo);
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/manifestacao', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'cliente');
    const rdo = await rdoDaRota(req);
    if (rdo.status !== 'enviado_cliente') throw new ApiError(409, 'TRANSICAO_INVALIDA', 'Este RDO ainda não está liberado para manifestação.');
    const { tipo, texto = '', assinatura } = req.body || {};
    if (!['ciencia', 'ressalva', 'esclarecimento'].includes(tipo)) throw validacao({ tipo: 'Escolha ciência, ressalva ou esclarecimento.' });
    if (['ressalva', 'esclarecimento'].includes(tipo) && !String(texto).trim()) throw validacao({ texto: 'Descreva sua manifestação.' });
    if (tipo !== 'esclarecimento' && (!assinatura?.tracos || !assinatura?.segundoFator)) throw validacao({ assinatura: 'A manifestação precisa de assinatura e segundo fator.' });
    if (tipo !== 'esclarecimento') {
      if (!assinatura?.segundoFator?.codigo) throw validacao({ assinatura: 'Confirme sua identidade com o segundo fator.' });
      await confirmarSegundoFator(req.usuario, assinatura.segundoFator.codigo);
      const agora = new Date().toISOString();
      const hash = rdo.hashTecnico;
      const assinada = await guardarAssinatura(rdo.id, req.usuario, assinatura, 'cliente', {
        versao: rdo.versao,
        tipo,
        texto: String(texto).trim(),
        ip: req.ip,
        dispositivo: req.get('X-Device-Label') || null,
        metodo2fa: 'otp',
        declaracao: textoDeclaracaoCliente(rdo, tipo),
        hash,
        dataHora: agora,
      });
      const hashFinal = await finalizarHashCliente(rdo, { ...assinada, dataHora: agora });
      const atualizado = await mudarEstado(rdo, 'finalizado', req.usuario, {
        finalizadoEm: agora,
        esclarecimentoPendente: false,
        hashFinal,
      }, 'enviado_cliente');
      const evento = tipo === 'ciencia' ? 'ciencia_cliente' : 'ressalva_cliente';
      await registrarEvento(rdo, evento, req.usuario, String(texto).trim() || 'Cliente manifestou ciência.');
      await registrarEvento(atualizado, 'finalizacao', req.usuario, 'RDO finalizado com manifestação do cliente.');
      await notificarMasters(atualizado, 'cliente_manifestou', 'Cliente respondeu ao RDO', `O cliente registrou ${tipo} no RDO ${String(rdo.numero).padStart(4, '0')}.`);
      await notificarAutor(atualizado, 'cliente_manifestou', 'Cliente respondeu ao RDO', `O cliente registrou ${tipo} no RDO ${String(rdo.numero).padStart(4, '0')}.`);
      return res.json(await carregarRdo(rdo.id, req.usuario));
    }
    const agora = new Date().toISOString();
    const comentario = { rdo_id: rdo.id, autor_id: req.usuario.id, papel: 'cliente', tipo: 'esclarecimento', contexto: 'geral', texto: String(texto).trim(), data_hora: agora, visibilidade: 'cliente' };
    const { error } = await db.from('comentarios').insert(comentario);
    if (error) throw erroDoBanco(error);
    const atualizado = await mudarEstado(rdo, 'enviado_cliente', req.usuario, { esclarecimentoPendente: true });
    await registrarEvento(rdo, 'esclarecimento_cliente', req.usuario, String(texto).trim());
    await notificarMasters(atualizado, 'esclarecimento', 'Cliente pediu esclarecimento', String(texto).trim());
    res.json(await rdoDaRota(req));
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/retificacao', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'master');
    const rdo = await rdoDaRota(req);
    const novo = await criarNovaVersao(rdo, req.usuario, req.body?.motivo);
    res.location(`/api/v1/rdos/${novo.id}`).status(201).json(novo);
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/cancelamento', async (req, res, next) => {
  try {
    exigePerfil(req.usuario, 'master');
    const rdo = await rdoDaRota(req);
    const motivo = String(req.body?.motivo || '').trim();
    if (!motivo) throw validacao({ motivo: 'Informe o motivo do cancelamento.' });
    if (['cancelado', 'retificado'].includes(rdo.status)) throw new ApiError(409, 'TRANSICAO_INVALIDA', 'Este RDO não pode ser cancelado.');
    const atualizado = await mudarEstado(rdo, 'cancelado', req.usuario, { cancelamento: { motivo, por: req.usuario.id, em: new Date().toISOString() }, esclarecimentoPendente: false });
    await registrarEvento(rdo, 'cancelamento', req.usuario, motivo);
    await notificarAutor(atualizado, 'sistema', 'RDO cancelado', motivo);
    if (rdo.liberadoAoClienteEm) await notificarClientes(atualizado, 'sistema', 'RDO cancelado', motivo);
    res.json(atualizado);
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/fotos', arquivoFoto, async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    await validarEdicaoFoto(rdo, req.usuario);
    const foto = await adicionarFoto(rdo, req.usuario, req.arquivoFoto, req.camposFoto);
    res.status(201).json(foto);
  } catch (error) {
    next(error);
  }
});

router.put('/rdos/:id/fotos/:fotoId', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    await validarEdicaoFoto(rdo, req.usuario);
    const foto = await buscarFoto(rdo.id, req.params.fotoId);
    const patch = {};
    if (Object.hasOwn(req.body || {}, 'legenda')) patch.legenda = req.body.legenda;
    if (Object.hasOwn(req.body || {}, 'local')) patch.local = req.body.local;
    if (Object.hasOwn(req.body || {}, 'vinculo')) {
      patch.vinculoTipo = req.body.vinculo?.tipo || null;
      patch.vinculoId = req.body.vinculo?.id || null;
    }
    const { data, error } = await db.from('fotos').update(paraBanco(patch)).eq('id', foto.id).select('*').single();
    if (error) throw erroDoBanco(error);
    res.json(fotoParaApi(data, rdo.id));
  } catch (error) {
    next(error);
  }
});

router.delete('/rdos/:id/fotos/:fotoId', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    await validarEdicaoFoto(rdo, req.usuario);
    const foto = await buscarFoto(rdo.id, req.params.fotoId);
    await apagarFoto(foto);
    const { data: fotos, error } = await db.from('fotos').select('id').eq('rdo_id', rdo.id).order('numero');
    if (error) throw erroDoBanco(error);
    for (let i = 0; i < (fotos || []).length; i++) {
      const { error: erroNumero } = await db.from('fotos').update({ numero: i + 1 }).eq('id', fotos[i].id);
      if (erroNumero) throw erroDoBanco(erroNumero);
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/rdos/:id/fotos/:fotoId/arquivo', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    const foto = await buscarFoto(rdo.id, req.params.fotoId);
    const arquivo = await enviarArquivo(foto);
    res.set('Content-Type', arquivo.type || 'application/octet-stream');
    res.set('Cache-Control', 'private, no-store');
    res.send(Buffer.from(await arquivo.arrayBuffer()));
  } catch (error) {
    next(error);
  }
});

router.post('/rdos/:id/visualizacoes', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    const limite = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data, error } = await db.from('auditoria_rdo').select('id').eq('rdo_id', rdo.id).eq('usuario_id', req.usuario.id).eq('evento', 'visualizacao').gte('data_hora', limite).limit(1);
    if (error) throw erroDoBanco(error);
    if (!data?.length) await registrarEvento(rdo, 'visualizacao', req.usuario, 'RDO visualizado.');
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Rotas mantidas no contrato para as próximas fatias da implementação.
router.get('/rdos/:id/assinaturas', async (req, res, next) => {
  try { res.json((await rdoDaRota(req)).assinaturas); } catch (error) { next(error); }
});
router.get('/rdos/:id/auditoria', async (req, res, next) => {
  try { res.json((await rdoDaRota(req)).auditoria); } catch (error) { next(error); }
});
router.get('/rdos/:id/comentarios', async (req, res, next) => {
  try { res.json((await rdoDaRota(req)).comentarios); } catch (error) { next(error); }
});
router.get('/rdos/:id/comprovante', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    if (!rdo.assinaturas?.master) throw naoEncontrado('Comprovante');
    res.json({ rdoId: rdo.id, numero: rdo.numero, versao: rdo.versao, hashTecnico: rdo.hashTecnico, hashFinal: rdo.hashFinal, assinaturas: rdo.assinaturas });
  } catch (error) { next(error); }
});

router.post('/rdos/:id/exclusao', exigirPerfil('master'), async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    const motivo = String(req.body?.motivo || '').trim();
    if (!motivo) throw validacao({ motivo: 'Informe o motivo da exclusão.' });
    if (!['rascunho', 'submetido', 'em_analise', 'devolvido'].includes(rdo.status) || rdo.assinaturas?.master)
      throw new ApiError(409, 'TRANSICAO_INVALIDA', 'RDOs assinados ou já liberados não podem ser excluídos.');
    const { error } = await db.from('rdos').delete().eq('id', rdo.id);
    if (error) throw erroDoBanco(error);
    const { error: erroAuditoria } = await db.from('auditoria_global').insert({ evento: 'exclusao', usuario_id: req.usuario.id, detalhe: `RDO ${String(rdo.numero).padStart(4, '0')} da obra ${rdo.obraId}: ${motivo}` });
    if (erroAuditoria) throw erroDoBanco(erroAuditoria);
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/rdos/:id/pdf', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    await registrarEvento(rdo, 'pdf_gerado', req.usuario, 'Comprovante PDF solicitado.');
    res.status(204).end();
  } catch (error) { next(error); }
});

router.put('/rdos/:id/edicao-master', exigirPerfil('master'), async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    if (!req.body?.justificativa?.trim() || !req.body?.alteracoes?.length) throw validacao({ justificativa: 'Informe a justificativa e as alterações.' });
    if (!['submetido', 'em_analise'].includes(rdo.status)) throw new ApiError(409, 'TRANSICAO_INVALIDA', 'Este RDO não pode ser editado pelo master.');
    const atualizado = await salvarConteudo(rdo, req.body.conteudo || {}, req.usuario, false, true);
    await registrarEvento(rdo, 'edicao_master', req.usuario, req.body.justificativa, { justificativa: req.body.justificativa, alteracoes: req.body.alteracoes });
    res.json(atualizado);
  } catch (error) { next(error); }
});

router.post('/rdos/:id/comentarios', async (req, res, next) => {
  try {
    const rdo = await rdoDaRota(req);
    const texto = String(req.body?.texto || '').trim();
    if (!texto) throw validacao({ texto: 'Escreva uma mensagem antes de enviar.' });
    const visibilidade = req.usuario.perfil === 'cliente' ? 'cliente' : req.usuario.perfil === 'master' ? (req.body?.visibilidade === 'cliente' ? 'cliente' : 'interno') : 'interno';
    if (visibilidade === 'cliente' && !rdo.liberadoAoClienteEm) throw new ApiError(409, 'TRANSICAO_INVALIDA', 'A conversa com o cliente só fica disponível depois da liberação do RDO.');
    const resposta = req.usuario.perfil === 'master' && rdo.status === 'enviado_cliente' && rdo.esclarecimentoPendente;
    const linha = {
      rdo_id: rdo.id,
      autor_id: req.usuario.id,
      papel: req.usuario.perfil,
      tipo: resposta ? 'resposta' : 'comentario',
      contexto: req.body?.contexto || 'geral',
      contexto_ref: req.body?.ref || null,
      texto,
      data_hora: new Date().toISOString(),
      visibilidade: resposta ? 'cliente' : visibilidade,
    };
    const { data, error } = await db.from('comentarios').insert(linha).select('*').single();
    if (error) throw erroDoBanco(error);
    let atual = rdo;
    if (resposta) {
      atual = await mudarEstado(rdo, rdo.status, req.usuario, { esclarecimentoPendente: false });
      await registrarEvento(atual, 'esclarecimento_respondido', req.usuario, texto);
      await notificarClientes(atual, 'esclarecimento', 'Esclarecimento respondido', texto);
    }
    await registrarEvento(rdo, 'comentario', req.usuario, texto);
    if (req.usuario.perfil === 'master') {
      if (visibilidade === 'cliente') await notificarClientes(atual, 'sistema', 'Comentário sobre o RDO', texto);
      else await notificarAutor(atual, 'sistema', 'Comentário sobre o RDO', texto);
    } else {
      await notificarMasters(atual, 'sistema', 'Novo comentário no RDO', texto);
    }
    res.status(201).json(doBanco(data));
  } catch (error) {
    next(error);
  }
});
