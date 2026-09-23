// Formatação e conversões numéricas no padrão pt-BR (vírgula decimal).
// Campos numéricos dos formulários trafegam como texto para preservar o que a pessoa digitou.

export function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const s = String(value).trim().replace(/\s/g, '');
  if (!s) return 0;
  // "1.234,56" -> 1234.56 | "8,5" -> 8.5 | "8.5" -> 8.5
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function isFilled(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function isValidNumber(value) {
  if (!isFilled(value)) return false;
  return /^\d+([.,]\d+)?$/.test(String(value).trim());
}

export function formatNumber(value, decimals = 0) {
  const n = toNumber(value);
  const fixed = n.toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const withThousands = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${withThousands},${dec}` : withThousands;
}

// Remove zeros à direita: 8.50 -> "8,5"; 42 -> "42"
export function formatQuantidade(value) {
  const n = toNumber(value);
  const rounded = Math.round(n * 1000) / 1000;
  return formatNumber(rounded, Number.isInteger(rounded) ? 0 : String(rounded).split('.')[1].length);
}

export function formatHoras(h) {
  const n = toNumber(h);
  return `${formatQuantidade(Math.round(n * 100) / 100)} h`;
}

export function formatPercent(value, decimals = 0) {
  return `${formatNumber(value, decimals)}%`;
}

export function pad4(n) {
  return String(n).padStart(4, '0');
}

export function numeroRdo(n) {
  return `nº ${pad4(n)}`;
}

export function plural(n, singular, pluralForm) {
  return n === 1 ? singular : pluralForm || `${singular}s`;
}

export function contar(n, singular, pluralForm) {
  return `${n} ${plural(n, singular, pluralForm)}`;
}

export function iniciais(nome = '') {
  const partes = nome
    .replace(/^(eng\.?|dr\.?|dra\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function primeiroNome(nome = '') {
  return nome.replace(/^(eng\.?|dr\.?|dra\.?)\s+/i, '').split(/\s+/)[0] || '';
}

export function normalizar(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function mascararEmail(email = '') {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 1)}${'*'.repeat(Math.max(2, user.length - 1))}@${domain}`;
}

// Máscara 'HH:MM' enquanto digita.
export function maskTime(text) {
  const digits = String(text).replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function maskDecimal(text) {
  const cleaned = String(text).replace(/[^0-9.,]/g, '');
  const firstSep = cleaned.search(/[.,]/);
  if (firstSep === -1) return cleaned;
  return cleaned.slice(0, firstSep + 1) + cleaned.slice(firstSep + 1).replace(/[.,]/g, '');
}

export function maskInteger(text) {
  return String(text).replace(/\D/g, '');
}

export function maskPhone(text) {
  const d = String(text).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

let counter = 0;
export function uid(prefix = 'id') {
  counter = (counter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function isEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function capitalizar(texto = '') {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

export function truncar(texto = '', max = 80) {
  return texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto;
}
