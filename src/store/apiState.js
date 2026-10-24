import { SCHEMA_VERSION, configuracoesPadrao } from '../data/seed.js';
import { CATALOGOS_PADRAO } from '../constants/index.js';

export function estadoServidorVazio(session) {
  return {
    schemaVersion: SCHEMA_VERSION,
    geradoEm: new Date().toISOString(),
    session,
    empresa: {},
    clientes: [],
    users: [],
    obras: [],
    rdos: [],
    notifications: [],
    auditoriaGlobal: [],
    files: [],
    catalogos: CATALOGOS_PADRAO,
    settings: configuracoesPadrao(),
    academico: { grupos: [], criterios: [], fases: [] },
    filaOffline: [],
  };
}

const permitidas = [
  'empresa',
  'clientes',
  'users',
  'obras',
  'rdos',
  'notifications',
  'auditoriaGlobal',
  'files',
  'catalogos',
  'academico',
  'settings',
];

export function aplicarResposta(state, resposta = {}) {
  let next = { ...state };
  for (const key of permitidas) {
    const valor = resposta.alteracoes?.[key];
    if (valor === undefined) continue;
    if (key === 'settings') {
      next.settings = {
        ...next.settings,
        ...valor,
        forceOffline: next.settings.forceOffline,
      };
    } else if (Array.isArray(valor)) {
      const ids = new Set(valor.map((item) => item.id));
      const anteriores = resposta.substituir?.includes(key) ? [] : next[key] || [];
      next[key] = [...anteriores.filter((item) => !ids.has(item.id)), ...valor];
    } else next[key] = valor;
    if (key === 'users') next.users = next.users.map(({ senha: _senha, ...u }) => u);
  }
  for (const [key, ids] of Object.entries(resposta.removidos || {})) {
    if (permitidas.includes(key) && Array.isArray(next[key]) && Array.isArray(ids))
      next[key] = next[key].filter((item) => !ids.includes(item.id));
  }
  return next;
}
