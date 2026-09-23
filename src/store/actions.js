// Transformadores de estado PUROS do protótipo: (state, args) => novoState.
// Concentram as regras de fluxo, notificações e auditoria. Quando o back-end existir, cada função
// vira uma chamada de API e o servidor passa a ser a fonte da verdade (hash, data/hora, IP).

import { uid, pad4 } from '../utils/format.js';
import { addHours, nowISO } from '../utils/date.js';
import { hashOf, clone, upsertById, removeById } from '../utils/object.js';
import { STATUS, PERFIL } from '../constants/index.js';
import { declaracaoMaster, declaracaoCliente } from '../constants/texts.js';
import { criarNotificacao } from '../domain/notificacoes.js';
import { conteudoTecnico, criarRdoVazio, proximoNumero } from '../domain/rdo.js';
import { validarRdo } from '../domain/validation.js';
import { liberadoAoCliente } from '../domain/workflow.js';
import { calcularLembretes } from '../domain/lembretes.js';
import { gerarSeed } from '../data/seed.js';
import { notaFinal } from '../data/seedAcademico.js';

// ---------------- helpers ----------------

const getUser = (s, id) => s.users.find((u) => u.id === id);
const getObra = (s, id) => s.obras.find((o) => o.id === id);
const getRdo = (s, id) => s.rdos.find((r) => r.id === id);
const masters = (s) => s.users.filter((u) => u.perfil === PERFIL.MASTER && u.ativo);
const clientesDaObra = (s, obra) => s.users.filter((u) => u.perfil === PERFIL.CLIENTE && u.ativo && (obra.usuarioIds || []).includes(u.id));
const rotulo = (rdo, obra) => `RDO nº ${pad4(rdo.numero)}${rdo.versao > 1 ? ` (v${rdo.versao})` : ''} da obra ${obra?.nome ?? ''}`.trim();

const patchRdo = (s, id, fn) => ({ ...s, rdos: s.rdos.map((r) => (r.id === id ? fn(r) : r)) });

function addAudit(rdo, { evento, usuarioId, detalhe = '', meta, now }) {
  return {
    ...rdo,
    auditoria: [...rdo.auditoria, { id: uid('au'), dataHora: now, evento, usuarioId, versao: rdo.versao, detalhe, ...(meta ? { meta } : {}) }],
  };
}

function addAuditGlobal(s, { evento, usuarioId, detalhe, now }) {
  return { ...s, auditoriaGlobal: [{ id: uid('ag'), dataHora: now, evento, usuarioId, detalhe }, ...s.auditoriaGlobal] };
}

const addNotifs = (s, novas) => (novas.length ? { ...s, notifications: [...novas, ...s.notifications] } : s);

function notificar(s, usuarios, dados, now) {
  return usuarios.filter(Boolean).map((usuario) => criarNotificacao({ usuario, dataHora: now, ...dados }));
}

const CAMPOS_CONTROLE = [
  'id', 'status', 'criadoEm', 'autorId', 'comentarios', 'auditoria', 'assinaturas', 'hashTecnico', 'hashFinal', 'sync', 'devolucao',
  'submetidoEm', 'liberadoAoClienteEm', 'finalizadoEm', 'cancelamento', 'esclarecimentoPendente', 'retificaDe', 'retificadoPor', 'motivoRetificacao',
];
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

// ---------------- sessão ----------------

export function entrar(s, { userId, manter = false }) {
  return { ...s, session: { ...s.session, userId, ultimoUserId: userId, manter } };
}

export function sair(s) {
  return { ...s, session: { ...s.session, userId: null } };
}

export function aceitarTermos(s, { userId, opcoes = {}, now = nowISO() }) {
  return { ...s, session: { ...s.session, termosAceitos: { ...s.session.termosAceitos, [userId]: { em: now, opcoes } } } };
}

export function definirBiometria(s, { userId, ativo }) {
  return { ...s, session: { ...s.session, biometria: { ...s.session.biometria, [userId]: !!ativo } } };
}

export function alterarSenha(s, { userId, senha }) {
  return { ...s, users: s.users.map((u) => (u.id === userId ? { ...u, senha } : u)) };
}

// ---------------- RDO: criação e edição (operacional) ----------------

export function criarRdo(s, { rdo, now = nowISO() }) {
  const criado = addAudit({ ...rdo, criadoEm: now, atualizadoEm: now }, {
    evento: 'criacao', usuarioId: rdo.autorId, now,
    detalhe: rdo.reaproveitadoDe ? 'RDO criado a partir do RDO anterior.' : 'RDO criado.',
  });
  return { ...s, rdos: [...s.rdos, criado] };
}

// Salvamento (automático ou manual). Nunca altera um RDO já bloqueado.
export function salvarRdo(s, { rdo, manual = false, now = nowISO() }) {
  const atual = getRdo(s, rdo.id);
  if (!atual || ![STATUS.RASCUNHO, STATUS.DEVOLVIDO].includes(atual.status)) return s;
  return patchRdo(s, rdo.id, (r) => {
    const novo = { ...rdo, ...pick(r, CAMPOS_CONTROLE), atualizadoEm: now };
    return manual ? addAudit(novo, { evento: 'rascunho_salvo', usuarioId: r.autorId, now, detalhe: 'Salvo manualmente.' }) : novo;
  });
}

export function submeterRdo(s, { rdoId, userId, online = true, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || ![STATUS.RASCUNHO, STATUS.DEVOLVIDO].includes(rdo.status)) return s;
  const obra = getObra(s, rdo.obraId);
  if (!validarRdo(rdo, { obra, rdos: s.rdos, agora: now }).valido) return s;
  const reenvio = rdo.status === STATUS.DEVOLVIDO;

  let next = patchRdo(s, rdoId, (r) => {
    const x = {
      ...r,
      status: STATUS.SUBMETIDO,
      submetidoEm: now,
      declaracao: { ...r.declaracao, dataHora: now },
      devolucao: null,
      atualizadoEm: now,
      sync: online ? { pendente: false, ultimoEm: now } : { pendente: true, ultimoEm: r.sync?.ultimoEm || null },
      fotos: online ? r.fotos.map((f) => ({ ...f, envio: 'enviada' })) : r.fotos,
    };
    return addAudit(x, {
      evento: reenvio ? 'correcao_reenvio' : 'submissao', usuarioId: userId, now,
      detalhe: online ? 'Todas as validações obrigatórias atendidas.' : 'Salvo no aparelho; será enviado quando a conexão voltar.',
    });
  });
  if (online) {
    next = addNotifs(next, notificar(next, masters(next), {
      tipo: 'rdo_submetido', titulo: reenvio ? 'RDO corrigido e reenviado' : 'RDO pronto para análise',
      mensagem: `${rotulo(rdo, obra)} ${reenvio ? 'foi corrigido e reenviado e ' : ''}está pronto para análise.`,
      obraId: obra.id, rdoId, rdoStatus: STATUS.SUBMETIDO, prazo: addHours(now, s.settings.lembretes.masterHoras),
    }, now));
  }
  return next;
}

// Sincroniza RDOs enviados offline (RF-05) e notifica o master como se acabassem de chegar.
export function sincronizarPendentes(s, { now = nowISO() } = {}) {
  const pendentes = s.rdos.filter((r) => r.sync?.pendente);
  if (!pendentes.length) return s;
  let next = s;
  for (const r of pendentes) {
    const obra = getObra(next, r.obraId);
    next = patchRdo(next, r.id, (x) => addAudit({
      ...x, sync: { pendente: false, ultimoEm: now }, fotos: x.fotos.map((f) => ({ ...f, envio: 'enviada' })),
    }, { evento: 'sincronizacao', usuarioId: x.autorId, now, detalhe: 'Dados e fotos sincronizados com o servidor.' }));
    next = addNotifs(next, notificar(next, masters(next), {
      tipo: 'rdo_submetido', titulo: 'RDO pronto para análise',
      mensagem: `${rotulo(r, obra)} está pronto para análise (sincronizado após reconexão).`,
      obraId: obra.id, rdoId: r.id, rdoStatus: r.status, prazo: addHours(now, s.settings.lembretes.masterHoras),
    }, now));
  }
  return next;
}

// ---------------- Análise (master) ----------------

export function registrarVisualizacao(s, { rdoId, userId, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo) return s;
  const recente = [...rdo.auditoria].reverse().find((a) => a.evento === 'visualizacao' && a.usuarioId === userId);
  if (recente && new Date(now).getTime() - new Date(recente.dataHora).getTime() < 10 * 60 * 1000) return s;
  return patchRdo(s, rdoId, (r) => addAudit(r, { evento: 'visualizacao', usuarioId: userId, now, detalhe: '' }));
}

export function iniciarAnalise(s, { rdoId, userId, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || rdo.status !== STATUS.SUBMETIDO) return s;
  return patchRdo(s, rdoId, (r) => addAudit({ ...r, status: STATUS.EM_ANALISE }, { evento: 'analise_iniciada', usuarioId: userId, now, detalhe: 'Master iniciou a leitura do registro.' }));
}

// visibilidade: 'interno' (master/operacional) ou 'cliente'. Comentários do cliente e respostas a
// pedidos de esclarecimento são sempre visíveis ao cliente; notas do master só se ele escolher.
export function comentarRdo(s, { rdoId, userId, texto, contexto = 'geral', contextoRef = null, visibilidade = 'interno', now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  const autor = getUser(s, userId);
  if (!rdo || !autor || !texto?.trim()) return s;
  const obra = getObra(s, rdo.obraId);
  const respondendo = autor.perfil === PERFIL.MASTER && rdo.esclarecimentoPendente;
  const publico = autor.perfil === PERFIL.CLIENTE || respondendo || (autor.perfil === PERFIL.MASTER && visibilidade === 'cliente' && liberadoAoCliente(rdo));
  const comentario = {
    id: uid('cm'), autorId: userId, papel: autor.perfil, tipo: respondendo ? 'resposta' : 'comentario', contexto, contextoRef,
    texto: texto.trim(), dataHora: now, visibilidade: publico ? 'cliente' : 'interno',
  };
  let next = patchRdo(s, rdoId, (r) => {
    const x = { ...r, comentarios: [...r.comentarios, comentario], esclarecimentoPendente: respondendo ? false : r.esclarecimentoPendente };
    const a = addAudit(x, { evento: 'comentario', usuarioId: userId, now, detalhe: texto.trim() });
    return respondendo ? addAudit(a, { evento: 'esclarecimento_respondido', usuarioId: userId, now, detalhe: texto.trim() }) : a;
  });

  // Quem é avisado: o outro lado da conversa.
  let destinatarios = [];
  if (autor.perfil === PERFIL.MASTER) {
    destinatarios = comentario.visibilidade === 'cliente' ? clientesDaObra(next, obra) : [getUser(next, rdo.autorId)];
  } else destinatarios = masters(next);
  next = addNotifs(next, notificar(next, destinatarios.filter((u) => u && u.id !== userId), {
    tipo: respondendo ? 'rdo_validado' : 'sistema',
    titulo: respondendo ? 'Esclarecimento respondido' : 'Novo comentário no RDO',
    mensagem: `${autor.nome} comentou no ${rotulo(rdo, obra)}: "${texto.trim().slice(0, 90)}${texto.length > 90 ? '…' : ''}"`,
    obraId: obra.id, rdoId, rdoStatus: rdo.status,
  }, now));
  return next;
}

export function devolverRdo(s, { rdoId, userId, motivo, prazo, contexto = 'geral', now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || ![STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(rdo.status) || !motivo?.trim()) return s;
  const obra = getObra(s, rdo.obraId);
  let next = patchRdo(s, rdoId, (r) => addAudit({
    ...r,
    status: STATUS.DEVOLVIDO,
    devolucao: { motivo: motivo.trim(), prazo, por: userId, em: now },
    comentarios: [...r.comentarios, { id: uid('cm'), autorId: userId, papel: PERFIL.MASTER, tipo: 'devolucao', contexto, texto: motivo.trim(), dataHora: now, visibilidade: 'interno' }],
    sync: { pendente: false, ultimoEm: r.sync?.ultimoEm || null },
  }, { evento: 'devolucao', usuarioId: userId, now, detalhe: motivo.trim() }));
  next = addNotifs(next, notificar(next, [getUser(next, rdo.autorId)], {
    tipo: 'rdo_devolvido', titulo: 'RDO devolvido para correção',
    mensagem: `${rotulo(rdo, obra)} foi devolvido. Motivo: ${motivo.trim()}`,
    obraId: obra.id, rdoId, rdoStatus: STATUS.DEVOLVIDO, prazo,
  }, now));
  return next;
}

// Edição pelo master: exige justificativa e registra antes/depois (seção 9).
export function editarComoMaster(s, { rdoId, userId, novo, justificativa, alteracoes = [], now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || ![STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(rdo.status) || !justificativa?.trim() || !alteracoes.length) return s;
  const obra = getObra(s, rdo.obraId);
  let next = patchRdo(s, rdoId, (r) => addAudit({
    ...novo, ...pick(r, CAMPOS_CONTROLE), atualizadoEm: now,
    comentarios: [...r.comentarios, { id: uid('cm'), autorId: userId, papel: PERFIL.MASTER, tipo: 'sistema', contexto: 'geral', texto: `Edição pelo master. Justificativa: ${justificativa.trim()}`, dataHora: now, visibilidade: 'interno' }],
  }, { evento: 'edicao_master', usuarioId: userId, now, detalhe: `Justificativa: ${justificativa.trim()}`, meta: { justificativa: justificativa.trim(), alteracoes } }));
  next = addNotifs(next, notificar(next, [getUser(next, rdo.autorId)], {
    tipo: 'sistema', titulo: 'RDO ajustado pelo master',
    mensagem: `${rotulo(rdo, obra)} foi ajustado pelo master (${alteracoes.length} ${alteracoes.length === 1 ? 'alteração' : 'alterações'}). Justificativa: ${justificativa.trim()}`,
    obraId: obra.id, rdoId, rdoStatus: rdo.status,
  }, now));
  return next;
}

// ---------------- Validação, assinatura e envio ----------------

function liberarAoCliente(s, rdoId, userId, canais, now, reenvio = false) {
  const rdo = getRdo(s, rdoId);
  const obra = getObra(s, rdo.obraId);
  const clientes = clientesDaObra(s, obra);
  const simular = s.settings.simularFalhaEmail;

  let next = patchRdo(s, rdoId, (r) => addAudit({
    ...r, status: STATUS.ENVIADO_CLIENTE, liberadoAoClienteEm: r.liberadoAoClienteEm && reenvio ? r.liberadoAoClienteEm : now,
  }, {
    evento: 'envio_cliente', usuarioId: userId, now,
    detalhe: `${reenvio ? 'Reenvio de notificação. ' : ''}Canais: ${(canais || ['app', 'email']).map((c) => ({ app: 'app', email: 'e-mail', whatsapp: 'WhatsApp' }[c] || c)).join(', ')}.`,
  }));
  const novas = notificar(next, clientes, {
    tipo: 'rdo_validado', titulo: 'RDO aguarda sua ciência/aceite',
    mensagem: `${rotulo(rdo, obra)} foi validado e aguarda sua ciência/aceite.`,
    obraId: obra.id, rdoId, rdoStatus: STATUS.ENVIADO_CLIENTE, prazo: addHours(now, s.settings.lembretes.clienteHoras[0]), simularFalhaEmail: simular,
  }, now);
  next = addNotifs(next, novas);
  if (simular && clientes.length) {
    // Falha de entrega (seção 10): registra o canal que falhou e permite reenvio ao master.
    const falhas = clientes.flatMap((c) => notificar(next, masters(next), {
      tipo: 'falha_entrega', titulo: 'Falha de entrega de e-mail',
      mensagem: `Não foi possível entregar o e-mail do ${rotulo(rdo, obra)} a ${c.nome}. Push entregue. Você pode reenviar.`,
      obraId: obra.id, rdoId, rdoStatus: STATUS.ENVIADO_CLIENTE, alvoId: c.id, simularFalhaEmail: true,
    }, now));
    next = addNotifs({ ...next, settings: { ...next.settings, simularFalhaEmail: false } }, falhas);
  }
  return next;
}

// Master valida, chancela e assina: o sistema fecha a versão técnica (hash).
export function validarEAssinar(s, { rdoId, userId, assinatura, enviarAgora = true, canais, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  const master = getUser(s, userId);
  if (!rdo || !master || ![STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(rdo.status) || !assinatura) return s;
  const obra = getObra(s, rdo.obraId);
  const hash = hashOf(conteudoTecnico(rdo));
  let next = patchRdo(s, rdoId, (r) => addAudit({
    ...r,
    status: STATUS.VALIDADO,
    hashTecnico: hash,
    assinaturas: {
      ...r.assinaturas,
      master: {
        usuarioId: userId, nome: master.nome, papel: PERFIL.MASTER, dataHora: now, versao: r.versao, hash,
        declaracao: declaracaoMaster(`nº ${pad4(r.numero)}`, r.versao), ...assinatura,
      },
    },
  }, { evento: 'validacao', usuarioId: userId, now, detalhe: `Versão técnica fechada. Hash ${hash.slice(0, 16)}…` }));
  next = addNotifs(next, notificar(next, [getUser(next, rdo.autorId)], {
    tipo: 'sistema', titulo: 'RDO validado pelo master',
    mensagem: `${rotulo(rdo, obra)} foi validado e assinado pelo responsável técnico.`,
    obraId: obra.id, rdoId, rdoStatus: STATUS.VALIDADO,
  }, now));
  return enviarAgora ? liberarAoCliente(next, rdoId, userId, canais, now) : next;
}

export function enviarAoCliente(s, { rdoId, userId, canais, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || rdo.status !== STATUS.VALIDADO) return s;
  return liberarAoCliente(s, rdoId, userId, canais, now);
}

export function reenviarNotificacaoCliente(s, { rdoId, userId, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || rdo.status !== STATUS.ENVIADO_CLIENTE) return s;
  return liberarAoCliente(s, rdoId, userId, ['app', 'email'], now, true);
}

// Reenvio de uma entrega que falhou (notificação do tipo falha_entrega).
export function reenviarEntrega(s, { notificacaoId, userId, now = nowISO() }) {
  const n = s.notifications.find((x) => x.id === notificacaoId);
  if (!n || n.tipo !== 'falha_entrega') return s;
  const rdo = getRdo(s, n.rdoId);
  const alvo = getUser(s, n.alvoId);
  let next = {
    ...s,
    notifications: s.notifications.map((x) => (x.id === notificacaoId
      ? { ...x, lida: true, resolvida: true, entregas: x.entregas.map((e) => (e.status === 'falha' ? { ...e, status: 'entregue', em: now } : e)) }
      : x)),
  };
  if (rdo) next = patchRdo(next, rdo.id, (r) => addAudit(r, { evento: 'envio_cliente', usuarioId: userId, now, detalhe: `Reenvio do e-mail a ${alvo?.nome || 'destinatário'} entregue com sucesso.` }));
  return next;
}

// ---------------- Cliente ----------------

export function assinarComoCliente(s, { rdoId, userId, tipo, texto = '', assinatura, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  const cliente = getUser(s, userId);
  if (!rdo || !cliente || rdo.status !== STATUS.ENVIADO_CLIENTE) return s;
  if (['ressalva', 'esclarecimento'].includes(tipo) && !texto.trim()) return s;
  const obra = getObra(s, rdo.obraId);

  if (tipo === 'esclarecimento') {
    let next = patchRdo(s, rdoId, (r) => addAudit({
      ...r,
      esclarecimentoPendente: true,
      comentarios: [...r.comentarios, { id: uid('cm'), autorId: userId, papel: PERFIL.CLIENTE, tipo: 'esclarecimento', contexto: 'geral', texto: texto.trim(), dataHora: now, visibilidade: 'cliente' }],
    }, { evento: 'esclarecimento_cliente', usuarioId: userId, now, detalhe: texto.trim() }));
    next = addNotifs(next, notificar(next, masters(next), {
      tipo: 'esclarecimento', titulo: 'Cliente solicitou esclarecimento',
      mensagem: `${cliente.nome} pediu esclarecimento no ${rotulo(rdo, obra)}: "${texto.trim().slice(0, 90)}${texto.length > 90 ? '…' : ''}"`,
      obraId: obra.id, rdoId, rdoStatus: rdo.status,
    }, now));
    return next;
  }

  const comRessalva = tipo === 'ressalva';
  const hashFinal = hashOf({ tecnico: rdo.hashTecnico, master: rdo.assinaturas.master?.dataHora, cliente: now, tipo, texto: texto.trim() });
  let next = patchRdo(s, rdoId, (r) => {
    const x = {
      ...r,
      status: STATUS.FINALIZADO,
      esclarecimentoPendente: false,
      finalizadoEm: now,
      hashFinal,
      assinaturas: {
        ...r.assinaturas,
        cliente: {
          usuarioId: userId, nome: cliente.nome, papel: PERFIL.CLIENTE, dataHora: now, versao: r.versao, tipo, texto: texto.trim(),
          hash: r.hashTecnico, declaracao: declaracaoCliente(tipo, `nº ${pad4(r.numero)}`, r.versao), ...assinatura,
        },
      },
    };
    const a = addAudit(x, { evento: comRessalva ? 'ressalva_cliente' : 'ciencia_cliente', usuarioId: userId, now, detalhe: comRessalva ? texto.trim() : 'Ciente, sem ressalvas.' });
    return addAudit(a, { evento: 'finalizacao', usuarioId: 'sistema', now, detalhe: `PDF final gerado. Hash final ${hashFinal.slice(0, 16)}…` });
  });
  next = addNotifs(next, notificar(next, [...masters(next), getUser(next, rdo.autorId)], {
    tipo: 'cliente_manifestou', titulo: comRessalva ? 'Cliente registrou ressalva' : 'Cliente deu ciência/aceite',
    mensagem: `${cliente.nome} ${comRessalva ? 'registrou ciência com ressalva' : 'registrou ciência/aceite'} no ${rotulo(rdo, obra)}. PDF final disponível.`,
    obraId: obra.id, rdoId, rdoStatus: STATUS.FINALIZADO,
  }, now));
  return next;
}

// ---------------- Retificar / cancelar / excluir ----------------

export function retificarRdo(s, { rdoId, userId, motivo, now = nowISO() }) {
  const original = getRdo(s, rdoId);
  if (!original || !motivo?.trim() || ![STATUS.VALIDADO, STATUS.ENVIADO_CLIENTE, STATUS.FINALIZADO].includes(original.status)) return s;
  const obra = getObra(s, original.obraId);
  const autor = getUser(s, original.autorId);
  const base = criarRdoVazio({ obra, autor, data: original.data, turno: original.turno, numero: original.numero, versao: original.versao + 1 });
  const novo = {
    ...base,
    ...clone(conteudoTecnico(original)),
    id: uid('rdo'),
    versao: original.versao + 1,
    status: STATUS.RASCUNHO,
    retificaDe: original.id,
    retificadoPor: null,
    motivoRetificacao: motivo.trim(),
    criadoEm: now,
    atualizadoEm: now,
    declaracao: { aceita: false, dataHora: null },
    assinaturaOperacional: null,
    comentarios: [],
    auditoria: [{ id: uid('au'), dataHora: now, evento: 'retificacao', usuarioId: userId, versao: original.versao + 1, detalhe: `Retificação da versão ${original.versao}. Motivo: ${motivo.trim()}` }],
  };
  delete novo.reaproveitadoDe;
  let next = patchRdo(s, rdoId, (r) => addAudit({ ...r, status: STATUS.RETIFICADO, retificadoPor: novo.id }, {
    evento: 'retificacao', usuarioId: userId, now, detalhe: `Substituído pela versão ${novo.versao}. Motivo: ${motivo.trim()}`,
  }));
  next = { ...next, rdos: [...next.rdos, novo] };
  next = addNotifs(next, notificar(next, [autor], {
    tipo: 'rdo_devolvido', titulo: 'Retificação aberta',
    mensagem: `${rotulo(novo, obra)}: retificação aberta pelo master. Motivo: ${motivo.trim()}`,
    obraId: obra.id, rdoId: novo.id, rdoStatus: STATUS.RASCUNHO,
  }, now));
  return next;
}

export function cancelarRdo(s, { rdoId, userId, motivo, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || !motivo?.trim() || [STATUS.CANCELADO, STATUS.RETIFICADO].includes(rdo.status)) return s;
  const obra = getObra(s, rdo.obraId);
  let next = patchRdo(s, rdoId, (r) => addAudit({
    ...r, status: STATUS.CANCELADO, cancelamento: { motivo: motivo.trim(), por: userId, em: now }, esclarecimentoPendente: false,
  }, { evento: 'cancelamento', usuarioId: userId, now, detalhe: motivo.trim() }));
  const alvos = [getUser(next, rdo.autorId), ...(rdo.liberadoAoClienteEm ? clientesDaObra(next, obra) : [])];
  next = addNotifs(next, notificar(next, alvos, {
    tipo: 'sistema', titulo: 'RDO cancelado', mensagem: `${rotulo(rdo, obra)} foi cancelado. Motivo: ${motivo.trim()}`,
    obraId: obra.id, rdoId, rdoStatus: STATUS.CANCELADO,
  }, now));
  return next;
}

// Exclusão física: exceção, somente registros não assinados (seção 9).
export function excluirRdo(s, { rdoId, userId, motivo, now = nowISO() }) {
  const rdo = getRdo(s, rdoId);
  if (!rdo || !motivo?.trim() || ![STATUS.RASCUNHO, STATUS.SUBMETIDO, STATUS.EM_ANALISE, STATUS.DEVOLVIDO].includes(rdo.status)) return s;
  const obra = getObra(s, rdo.obraId);
  const next = { ...s, rdos: removeById(s.rdos, rdoId), notifications: s.notifications.filter((n) => n.rdoId !== rdoId) };
  return addAuditGlobal(next, { evento: 'exclusao', usuarioId: userId, now, detalhe: `RDO ${pad4(rdo.numero)} (${obra?.nome}) excluído. Motivo: ${motivo.trim()}` });
}

export function registrarPdf(s, { rdoId, userId, now = nowISO() }) {
  if (!getRdo(s, rdoId)) return s;
  return patchRdo(s, rdoId, (r) => addAudit(r, { evento: 'pdf_gerado', usuarioId: userId, now, detalhe: 'PDF gerado/compartilhado pelo aplicativo.' }));
}

// ---------------- Notificações ----------------

export function marcarNotificacaoLida(s, { id }) {
  return { ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, lida: true } : n)) };
}

export function marcarTodasLidas(s, { userId }) {
  return { ...s, notifications: s.notifications.map((n) => (n.usuarioId === userId ? { ...n, lida: true } : n)) };
}

export function processarLembretes(s, { now = nowISO() } = {}) {
  return addNotifs(s, calcularLembretes(s, now));
}

// ---------------- Cadastros ----------------

export function salvarObra(s, { obra, userId, now = nowISO() }) {
  const existe = s.obras.some((o) => o.id === obra.id);
  const cliente = s.clientes.find((c) => c.id === obra.clienteId);
  const rt = getUser(s, obra.engenheiroRTId);
  const completa = {
    ...obra,
    clienteNome: cliente?.nome || obra.clienteNome || '',
    empresaExecutora: obra.empresaExecutora || s.empresa.nome,
    engenheiroRT: rt ? `${rt.nome}${rt.crea ? ` — ${rt.crea}` : ' — CREA 123456789-0 MA'}` : obra.engenheiroRT,
  };
  return addAuditGlobal({ ...s, obras: upsertById(s.obras, completa) }, {
    evento: 'obra', usuarioId: userId, now, detalhe: `${completa.nome} ${existe ? 'atualizada' : 'cadastrada'} (${completa.contrato || 'sem contrato'}).`,
  });
}

// obraIds: vínculos do usuário (RF-03 — permissão por obra). Mantém obra.usuarioIds coerente.
export function salvarUsuario(s, { usuario, obraIds = null, userId, now = nowISO() }) {
  const existe = s.users.some((u) => u.id === usuario.id);
  let next = { ...s, users: upsertById(s.users, existe ? { ...s.users.find((u) => u.id === usuario.id), ...usuario } : { canais: { push: true, email: true, whatsapp: false }, senha: '123456', ativo: true, criadoEm: now, ...usuario }) };
  if (obraIds && usuario.perfil !== PERFIL.MASTER) {
    next = {
      ...next,
      obras: next.obras.map((o) => {
        const tem = (o.usuarioIds || []).includes(usuario.id);
        const deve = obraIds.includes(o.id);
        if (tem === deve) return o;
        return { ...o, usuarioIds: deve ? [...(o.usuarioIds || []), usuario.id] : o.usuarioIds.filter((id) => id !== usuario.id) };
      }),
    };
  }
  return addAuditGlobal(next, { evento: 'usuario', usuarioId: userId, now, detalhe: `Usuário ${usuario.nome} ${existe ? 'atualizado' : 'cadastrado (convite enviado por e-mail — simulado)'}.` });
}

export function alternarUsuarioAtivo(s, { id, userId, now = nowISO() }) {
  const alvo = getUser(s, id);
  if (!alvo) return s;
  return addAuditGlobal({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u)) }, {
    evento: 'usuario', usuarioId: userId, now, detalhe: `Usuário ${alvo.nome} ${alvo.ativo ? 'bloqueado' : 'reativado'}.`,
  });
}

export function salvarCliente(s, { cliente, userId, now = nowISO() }) {
  const existe = s.clientes.some((c) => c.id === cliente.id);
  const clientes = upsertById(s.clientes, cliente);
  const obras = s.obras.map((o) => (o.clienteId === cliente.id ? { ...o, clienteNome: cliente.nome } : o));
  return addAuditGlobal({ ...s, clientes, obras }, { evento: 'obra', usuarioId: userId, now, detalhe: `Cliente ${cliente.nome} ${existe ? 'atualizado' : 'cadastrado'}.` });
}

export function salvarEmpresa(s, { empresa, userId, now = nowISO() }) {
  return addAuditGlobal({ ...s, empresa: { ...s.empresa, ...empresa } }, { evento: 'obra', usuarioId: userId, now, detalhe: 'Dados da empresa atualizados.' });
}

export function salvarCatalogo(s, { chave, lista }) {
  return { ...s, catalogos: { ...s.catalogos, [chave]: lista } };
}

export function atualizarConfiguracoes(s, { patch }) {
  const lembretes = patch.lembretes ? { ...s.settings.lembretes, ...patch.lembretes } : s.settings.lembretes;
  return { ...s, settings: { ...s.settings, ...patch, lembretes } };
}

export function atualizarCanais(s, { userId, canais }) {
  return { ...s, users: s.users.map((u) => (u.id === userId ? { ...u, canais: { ...u.canais, ...canais } } : u)) };
}

export function registrarExportacao(s, { arquivo, userId, now = nowISO() }) {
  const item = { id: uid('fl'), criadoEm: now, criadoPor: userId, ...arquivo };
  return addAuditGlobal({ ...s, files: [item, ...s.files] }, { evento: 'exportacao', usuarioId: userId, now, detalhe: `${arquivo.nome} (${arquivo.tipo.toUpperCase()}).` });
}

// ---------------- Acadêmico (RF-20) ----------------

export function salvarAvaliacao(s, { grupoId, faseId, notas, comentario, now = nowISO() }) {
  const final = notaFinal(notas, s.academico.criterios);
  return {
    ...s,
    academico: {
      ...s.academico,
      grupos: s.academico.grupos.map((g) => (g.id !== grupoId ? g : {
        ...g,
        entregas: g.entregas.map((e) => (e.faseId !== faseId ? e : {
          ...e, status: 'avaliada', notas, comentario, avaliadoEm: now, notaFinal: final,
        })),
      })),
    },
  };
}

export function registrarEntregaAcademica(s, { grupoId, faseId, arquivo, comentario = '', now = nowISO() }) {
  return {
    ...s,
    academico: {
      ...s.academico,
      grupos: s.academico.grupos.map((g) => (g.id !== grupoId ? g : {
        ...g,
        entregas: g.entregas.map((e) => (e.faseId !== faseId ? e : {
          ...e, status: 'em_avaliacao', versoes: [...e.versoes, { numero: e.versoes.length + 1, data: now, arquivo, comentario }],
        })),
      })),
    },
  };
}

// ---------------- Demonstração ----------------

export function resetarDemo(s, { now = nowISO() } = {}) {
  return { ...gerarSeed(now), session: { ...s.session } };
}

// Mapa nome -> função, usado pelo provider para expor `actions.<nome>(args)`.
export const ACTIONS = {
  entrar, sair, aceitarTermos, definirBiometria, alterarSenha,
  criarRdo, salvarRdo, submeterRdo, sincronizarPendentes,
  registrarVisualizacao, iniciarAnalise, comentarRdo, devolverRdo, editarComoMaster,
  validarEAssinar, enviarAoCliente, reenviarNotificacaoCliente, reenviarEntrega, assinarComoCliente,
  retificarRdo, cancelarRdo, excluirRdo, registrarPdf,
  marcarNotificacaoLida, marcarTodasLidas, processarLembretes,
  salvarObra, salvarUsuario, alternarUsuarioAtivo, salvarCliente, salvarEmpresa, salvarCatalogo, atualizarConfiguracoes, atualizarCanais,
  registrarExportacao, salvarAvaliacao, registrarEntregaAcademica, resetarDemo,
};

export { proximoNumero };
