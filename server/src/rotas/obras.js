import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { autenticar, exigirPerfil } from '../middleware/autenticar.js';
import { ApiError, erroDoBanco, naoEncontrado, validacao } from '../erros.js';
import { db } from '../supabase.js';
import { doBanco } from '../mapear.js';
import { criarRdo } from './rdo-service.js';

export const router = Router();

async function obrasDoUsuario(usuario) {
  let query = db.from('obras').select('*').order('nome');
  if (usuario.perfil === 'operacional' || usuario.perfil === 'cliente') {
    const { data: vinculos, error } = await db.from('obra_usuario').select('obra_id').eq('usuario_id', usuario.id);
    if (error) throw erroDoBanco(error);
    const ids = (vinculos || []).map((v) => v.obra_id);
    if (!ids.length) return [];
    query = query.in('id', ids);
  }
  const { data, error } = await query;
  if (error) throw erroDoBanco(error);
  return data || [];
}

async function podeAcessarObra(obraId, usuario) {
  const { data: obra, error } = await db.from('obras').select('*').eq('id', obraId).maybeSingle();
  if (error) throw erroDoBanco(error);
  if (!obra) throw naoEncontrado('Obra');
  if (usuario.perfil === 'master') return obra;
  const { data: vinculo, error: erroVinculo } = await db
    .from('obra_usuario')
    .select('obra_id')
    .eq('obra_id', obraId)
    .eq('usuario_id', usuario.id)
    .maybeSingle();
  if (erroVinculo) throw erroDoBanco(erroVinculo);
  if (!vinculo) throw naoEncontrado('Obra');
  return obra;
}

async function dadosDaObra(body) {
  const obrigatorios = ['nome', 'contrato', 'clienteId', 'endereco', 'inicio', 'inicioRegistro', 'fim', 'engenheiroRTId'];
  const faltando = Object.fromEntries(obrigatorios.filter((campo) => !body?.[campo]).map((campo) => [campo, 'Preencha este campo.']));
  if (Object.keys(faltando).length) throw validacao(faltando);
  const [{ data: cliente, error: erroCliente }, { data: rt, error: erroRt }, { data: empresa, error: erroEmpresa }] = await Promise.all([
    db.from('clientes').select('id, nome').eq('id', body.clienteId).maybeSingle(),
    db.from('usuarios').select('id, nome, crea').eq('id', body.engenheiroRTId).maybeSingle(),
    db.from('empresa').select('nome').limit(1).maybeSingle(),
  ]);
  if (erroCliente || erroRt || erroEmpresa) throw erroDoBanco(erroCliente || erroRt || erroEmpresa);
  if (!cliente) throw validacao({ clienteId: 'Selecione um cliente cadastrado.' });
  if (!rt) throw validacao({ engenheiroRTId: 'Selecione um responsável técnico cadastrado.' });
  const usuarioIds = Array.isArray(body.usuarioIds) ? [...new Set(body.usuarioIds)] : [];
  if (usuarioIds.length) {
    const { data: usuarios, error } = await db.from('usuarios').select('id, perfil').in('id', usuarioIds);
    if (error) throw erroDoBanco(error);
    if (usuarios.length !== usuarioIds.length) throw validacao({ usuarioIds: 'Confira os usuários vinculados à obra.' });
  }
  return {
    obra: {
      nome: body.nome.trim(), descricao: body.descricao || null, contrato: body.contrato,
      os: body.os || null, cliente_id: cliente.id, empresa_executora: body.empresaExecutora || empresa?.nome || null,
      endereco: body.endereco, inicio: body.inicio, inicio_registro: body.inicioRegistro, fim: body.fim,
      engenheiro_rt_id: rt.id, engenheiro_rt: `Eng. ${rt.nome}${rt.crea ? ` — CREA ${rt.crea}` : ''}`,
      dias_uteis: Array.isArray(body.diasUteis) ? body.diasUteis : [1, 2, 3, 4, 5, 6],
      exige_assinatura_operacional: body.exigeAssinaturaOperacional === true,
      status: body.status || 'ativa',
    },
    usuarioIds,
  };
}

async function salvarVinculos(obraId, usuarioIds) {
  const { error: erroDelete } = await db.from('obra_usuario').delete().eq('obra_id', obraId);
  if (erroDelete) throw erroDoBanco(erroDelete);
  if (!usuarioIds.length) return;
  const { error } = await db.from('obra_usuario').insert(usuarioIds.map((usuario_id) => ({ obra_id: obraId, usuario_id })));
  if (error) throw erroDoBanco(error);
}

router.get('/obras', autenticar, async (req, res, next) => {
  try {
    const obras = await obrasDoUsuario(req.usuario);
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const porPagina = Math.min(100, Math.max(1, Number(req.query.porPagina) || 20));
    const filtradas = obras.filter((obra) => {
      if (req.query.status && obra.status !== req.query.status) return false;
      if (req.query.clienteId && obra.cliente_id !== req.query.clienteId) return false;
      return true;
    });
    res.json({
      itens: filtradas.slice((pagina - 1) * porPagina, pagina * porPagina).map(doBanco),
      total: filtradas.length,
      pagina,
      porPagina,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/obras/:id', autenticar, async (req, res, next) => {
  try {
    const obra = await podeAcessarObra(req.params.id, req.usuario);
    const { data: vinculos, error } = await db.from('obra_usuario').select('usuario_id').eq('obra_id', obra.id);
    if (error) throw erroDoBanco(error);
    res.json({ ...doBanco(obra), usuarioIds: (vinculos || []).map((v) => v.usuario_id) });
  } catch (error) {
    next(error);
  }
});

router.get('/obras/:id/rdos/acumulado', autenticar, async (req, res, next) => {
  try {
    if (!['master', 'operacional'].includes(req.usuario.perfil))
      throw new ApiError(403, 'PROIBIDO', 'Seu perfil não pode consultar o acumulado da obra.');
    await podeAcessarObra(req.params.id, req.usuario);
    const { data, error } = await db
      .from('rdos')
      .select('id, data, status, atividades(servico, quantidade_dia)')
      .eq('obra_id', req.params.id)
      .lt('data', req.query.data || '9999-12-31')
      .not('status', 'in', '(rascunho,cancelado,retificado)');
    if (error) throw erroDoBanco(error);
    const servico = String(req.query.servico || '').trim().toLowerCase();
    const acumulado = (data || [])
      .filter((rdo) => rdo.id !== req.query.ignorarRdoId)
      .flatMap((rdo) => rdo.atividades || [])
      .filter((atividade) => atividade.servico.trim().toLowerCase() === servico)
      .reduce((total, atividade) => total + Number(atividade.quantidade_dia || 0), 0);
    res.json({ servico: req.query.servico || '', acumulado });
  } catch (error) {
    next(error);
  }
});

router.post('/obras/:id/rdos', autenticar, async (req, res, next) => {
  try {
    if (req.usuario.perfil !== 'operacional') throw new ApiError(403, 'PROIBIDO', 'Somente o operacional cria RDO.');
    const obra = await podeAcessarObra(req.params.id, req.usuario);
    if (!req.body?.data || !req.body?.turno)
      throw validacao({ ...(!req.body?.data && { data: 'Informe a data.' }), ...(!req.body?.turno && { turno: 'Informe o turno.' }) });
    const rdo = await criarRdo({ obra, usuario: req.usuario, entrada: req.body });
    res.location(`/api/v1/rdos/${rdo.id}`).status(201).json(rdo);
  } catch (error) {
    next(error);
  }
});

router.post('/obras', autenticar, exigirPerfil('master'), async (req, res, next) => {
  try {
    const { obra, usuarioIds } = await dadosDaObra(req.body);
    const { data, error } = await db.from('obras').insert({ id: randomUUID(), ...obra }).select('*').single();
    if (error) throw erroDoBanco(error);
    try {
      await salvarVinculos(data.id, usuarioIds);
      const { error: erroAuditoria } = await db.from('auditoria_global').insert({ evento: 'obra', usuario_id: req.usuario.id, detalhe: `Obra criada: ${data.nome}.` });
      if (erroAuditoria) throw erroDoBanco(erroAuditoria);
    } catch (errorVinculo) {
      await db.from('obras').delete().eq('id', data.id);
      throw errorVinculo;
    }
    res.status(201).json({ ...doBanco(data), usuarioIds });
  } catch (error) {
    next(error);
  }
});

router.put('/obras/:id', autenticar, exigirPerfil('master'), async (req, res, next) => {
  try {
    const { obra, usuarioIds } = await dadosDaObra(req.body);
    const { data, error } = await db.from('obras').update(obra).eq('id', req.params.id).select('*').maybeSingle();
    if (error) throw erroDoBanco(error);
    if (!data) throw naoEncontrado('Obra');
    await salvarVinculos(data.id, usuarioIds);
    const { error: erroAuditoria } = await db.from('auditoria_global').insert({ evento: 'obra', usuario_id: req.usuario.id, detalhe: `Obra atualizada: ${data.nome}.` });
    if (erroAuditoria) throw erroDoBanco(erroAuditoria);
    res.json({ ...doBanco(data), usuarioIds });
  } catch (error) {
    next(error);
  }
});
