import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCHEMA_VERSION } from '../data/seed.js';

// Persistência local do protótipo (offline-first). Uma chave por fatia para evitar linhas grandes
// no AsyncStorage (limite de ~2 MB por valor no Android).
const PREFIX = 'rdo:v1:';
const SLICES = ['meta', 'empresa', 'clientes', 'users', 'obras', 'rdos', 'notifications', 'auditoriaGlobal', 'files', 'catalogos', 'settings', 'academico', 'session'];

function sliceValue(state, key) {
  if (key === 'meta') return { schemaVersion: state.schemaVersion, geradoEm: state.geradoEm };
  if (key === 'session') {
    const s = state.session;
    // Sem "manter conectado", a sessão não é restaurada: o app sempre abre na autenticação.
    return { ...s, userId: s.manter ? s.userId : null };
  }
  return state[key];
}

export async function loadState() {
  try {
    const pairs = await AsyncStorage.multiGet(SLICES.map((k) => PREFIX + k));
    const data = {};
    for (const [k, v] of pairs) {
      if (v == null) return null;
      data[k.slice(PREFIX.length)] = JSON.parse(v);
    }
    if (data.meta?.schemaVersion !== SCHEMA_VERSION) return null;
    const { meta, ...rest } = data;
    return { ...rest, schemaVersion: meta.schemaVersion, geradoEm: meta.geradoEm };
  } catch (e) {
    return null;
  }
}

let timer = null;
let pending = null;

// Grava apenas as fatias cujas referências mudaram, com debounce (o formulário salva a cada digitação).
export function persistState(prev, next) {
  const changed = SLICES.filter((k) => {
    if (!prev) return true;
    // session/meta são derivadas (novo objeto a cada leitura): compara por conteúdo.
    if (k === 'session' || k === 'meta') return JSON.stringify(sliceValue(prev, k)) !== JSON.stringify(sliceValue(next, k));
    return prev[k] !== next[k];
  });
  if (!changed.length) return;
  pending = { ...(pending || {}) };
  changed.forEach((k) => {
    pending[k] = sliceValue(next, k);
  });
  clearTimeout(timer);
  timer = setTimeout(flushPersist, 450);
}

export async function flushPersist() {
  clearTimeout(timer);
  const batch = pending;
  pending = null;
  if (!batch) return;
  try {
    await AsyncStorage.multiSet(Object.entries(batch).map(([k, v]) => [PREFIX + k, JSON.stringify(v)]));
  } catch (e) {
    // Falha de gravação não deve derrubar o app; o estado em memória segue válido.
  }
}

export async function clearPersisted() {
  clearTimeout(timer);
  pending = null;
  try {
    await AsyncStorage.multiRemove(SLICES.map((k) => PREFIX + k));
  } catch (e) {
    // ignora
  }
}
