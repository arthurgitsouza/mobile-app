// Seletores puros: o que cada perfil enxerga (RF-03 — permissões por perfil e por obra).

import { PERFIL, STATUS } from '../constants/index.js';
import { podeVerRdo, usuarioNaObra } from './workflow.js';
import { hojeObra, diaDaSemana, addDays, eachDay, diffDays } from '../utils/date.js';
import { sortBy } from '../utils/object.js';

export function obrasVisiveis(state, user) {
  if (!user) return [];
  if (user.perfil === PERFIL.MASTER) return state.obras;
  return state.obras.filter((o) => usuarioNaObra(user, o));
}

// RDOs visíveis: operacional/cliente só nas obras vinculadas; cliente só os liberados;
// itens ainda não sincronizados (offline) só aparecem para o próprio autor.
export function rdosVisiveis(state, user) {
  if (!user) return [];
  return state.rdos.filter((r) => {
    const obra = state.obras.find((o) => o.id === r.obraId);
    if (!obra || !podeVerRdo(r, user, obra)) return false;
    if (r.sync?.pendente && r.autorId !== user.id) return false;
    return true;
  });
}

export function notificacoesDe(state, user) {
  if (!user) return [];
  return sortBy(state.notifications.filter((n) => n.usuarioId === user.id), (n) => n.dataHora, 'desc');
}

export function naoLidas(state, user) {
  return notificacoesDe(state, user).filter((n) => !n.lida).length;
}

export function usuariosDaObra(state, obra) {
  return state.users.filter((u) => (obra.usuarioIds || []).includes(u.id) || u.perfil === PERFIL.MASTER);
}

export function obrasDoUsuario(state, usuario) {
  if (usuario.perfil === PERFIL.MASTER) return state.obras;
  return state.obras.filter((o) => (o.usuarioIds || []).includes(usuario.id));
}

export function ehDiaUtil(obra, ymd) {
  return (obra.diasUteis || [1, 2, 3, 4, 5, 6]).includes(diaDaSemana(ymd));
}

// RDO "de hoje" (não cancelado/retificado) da obra, mais recente versão.
export function rdoDaData(state, obraId, ymd) {
  return sortBy(
    state.rdos.filter((r) => r.obraId === obraId && r.data === ymd && ![STATUS.CANCELADO, STATUS.RETIFICADO].includes(r.status)),
    (r) => r.versao,
    'desc',
  )[0] || null;
}

export function rdosAguardandoAnalise(state) {
  return sortBy(
    state.rdos.filter((r) => [STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(r.status) && !r.sync?.pendente),
    (r) => r.submetidoEm || '',
    'asc',
  );
}

// Dias úteis da obra sem RDO enviado (atrasados), dentro da janela informada — usa os últimos `dias`.
export function diasSemRdo(state, obra, hoje = hojeObra(), dias = 14) {
  const base = obra.inicioRegistro || obra.inicio; // o registro digital começa no 1º RDO, não no início do contrato
  const inicio = base > addDays(hoje, -dias) ? base : addDays(hoje, -dias);
  const enviados = new Set(
    state.rdos
      .filter((r) => r.obraId === obra.id && !['rascunho', 'devolvido', 'cancelado'].includes(r.status))
      .map((r) => r.data),
  );
  return eachDay(inicio, addDays(hoje, -1)).filter((d) => ehDiaUtil(obra, d) && !enviados.has(d));
}

export function diasPrevistos(obra, de, ate) {
  return eachDay(de < obra.inicio ? obra.inicio : de, ate).filter((d) => ehDiaUtil(obra, d));
}

export function idadeEmDias(ymd, hoje = hojeObra()) {
  return diffDays(hoje, ymd);
}

export function nomeUsuario(state, id) {
  if (id === 'sistema') return 'Sistema';
  return state.users.find((u) => u.id === id)?.nome || 'Usuário removido';
}

export function perfilUsuario(state, id) {
  return state.users.find((u) => u.id === id)?.perfil || null;
}
