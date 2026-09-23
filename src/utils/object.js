import { sha256 } from './sha256.js';

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

// Atualização imutável por caminho: setIn(obj, ['clima', 'choveu'], true)
export function setIn(obj, path, value) {
  const [head, ...rest] = path;
  const base = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  base[head] = rest.length ? setIn(base[head], rest, value) : value;
  return base;
}

export function getIn(obj, path, fallback) {
  let cur = obj;
  for (const key of path) {
    if (cur === null || cur === undefined) return fallback;
    cur = cur[key];
  }
  return cur === undefined ? fallback : cur;
}

// JSON estável (chaves ordenadas) para hashing reprodutível.
export function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`).join(',')}}`;
}

export function hashOf(value) {
  return sha256(canonicalStringify(value));
}

export function updateById(list, id, patch) {
  return list.map((item) => (item.id === id ? { ...item, ...(typeof patch === 'function' ? patch(item) : patch) } : item));
}

export function upsertById(list, item) {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

export function removeById(list, id) {
  return list.filter((x) => x.id !== id);
}

export function sortBy(list, keyFn, dir = 'asc') {
  const mul = dir === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (ka < kb) return -1 * mul;
    if (ka > kb) return 1 * mul;
    return 0;
  });
}

export function groupBy(list, keyFn) {
  const map = {};
  for (const item of list) {
    const k = keyFn(item);
    (map[k] = map[k] || []).push(item);
  }
  return map;
}

export function sum(list, fn = (x) => x) {
  return list.reduce((acc, x) => acc + (fn(x) || 0), 0);
}

// Diferença "antes/depois" entre dois conteúdos de RDO (edição pelo master exige justificativa e registro — seção 9).
// Retorna [{ caminho, antes, depois }]; listas com `id` são comparadas item a item.
export function diffConteudo(antes, depois, rotulos = {}, caminho = []) {
  const out = [];
  const label = (path) => path.map((p) => rotulos[p] || p).join(' › ');

  if (Array.isArray(antes) || Array.isArray(depois)) {
    const a = antes || [];
    const b = depois || [];
    const hasIds = [...a, ...b].every((x) => x && typeof x === 'object' && 'id' in x);
    if (hasIds) {
      for (const item of b) {
        const prev = a.find((x) => x.id === item.id);
        const nome = item.funcao || item.tipo || item.servico || item.material || item.fato || item.visitante || item.descricao || item.legenda || item.id;
        if (!prev) out.push({ caminho: `${label(caminho)} › ${nome}`, antes: '—', depois: 'item adicionado' });
        else out.push(...diffConteudo(prev, item, rotulos, [...caminho, String(nome)]));
      }
      for (const item of a) {
        if (!b.some((x) => x.id === item.id)) {
          const nome = item.funcao || item.tipo || item.servico || item.material || item.fato || item.visitante || item.descricao || item.legenda || item.id;
          out.push({ caminho: `${label(caminho)} › ${nome}`, antes: 'item existente', depois: 'removido' });
        }
      }
      return out;
    }
    if (canonicalStringify(a) !== canonicalStringify(b)) out.push({ caminho: label(caminho), antes: a.join(', '), depois: b.join(', ') });
    return out;
  }

  if (antes && depois && typeof antes === 'object' && typeof depois === 'object') {
    const keys = new Set([...Object.keys(antes), ...Object.keys(depois)]);
    for (const k of keys) out.push(...diffConteudo(antes[k], depois[k], rotulos, [...caminho, k]));
    return out;
  }

  if (antes !== depois && !(antes == null && depois == null)) {
    const show = (v) => (v === undefined || v === null || v === '' ? '—' : typeof v === 'boolean' ? (v ? 'sim' : 'não') : String(v));
    out.push({ caminho: label(caminho), antes: show(antes), depois: show(depois) });
  }
  return out;
}
