// Datas e horas no fuso da obra (RNF-06): São Luís/MA = UTC-3, sem horário de verão.
// Datas de calendário trafegam como 'YYYY-MM-DD'; instantes como ISO 8601 em UTC.

const OBRA_OFFSET_MIN = -180;
const MS_MIN = 60 * 1000;
const MS_DAY = 24 * 60 * MS_MIN;

export const FUSO_OBRA_LABEL = 'UTC−03:00 (São Luís/MA)';

const pad = (n) => String(n).padStart(2, '0');

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const nomesMeses = MESES;
export const nomesDiasCurtos = DIAS_CURTOS;

export function nowISO() {
  return new Date().toISOString();
}

// Date "deslocada" para o fuso da obra: usar somente getUTC*.
function shifted(iso) {
  return new Date(new Date(iso).getTime() + OBRA_OFFSET_MIN * MS_MIN);
}

export function ymdFromDateUTC(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function hojeObra(nowIso = nowISO()) {
  return ymdFromDateUTC(shifted(nowIso));
}

export function horaAgoraObra(nowIso = nowISO()) {
  const d = shifted(nowIso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function parseYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(ymd, n) {
  return ymdFromDateUTC(new Date(parseYMD(ymd).getTime() + n * MS_DAY));
}

export function diffDays(a, b) {
  return Math.round((parseYMD(a).getTime() - parseYMD(b).getTime()) / MS_DAY);
}

export function diaDaSemana(ymd) {
  return parseYMD(ymd).getUTCDay();
}

export function nomeDiaSemana(ymd) {
  return DIAS_SEMANA[diaDaSemana(ymd)];
}

export function nomeDiaCurto(ymd) {
  return DIAS_CURTOS[diaDaSemana(ymd)];
}

export function formatDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

export function formatDateShort(ymd) {
  if (!ymd) return '—';
  const [, m, d] = ymd.split('-');
  return `${d}/${m}`;
}

export function formatDateLong(ymd) {
  if (!ymd) return '—';
  const d = parseYMD(ymd);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

export function formatDayMonth(ymd) {
  const d = parseYMD(ymd);
  return `${d.getUTCDate()} ${MESES_CURTOS[d.getUTCMonth()]}`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = shifted(iso);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = shifted(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function dateFromISO(iso) {
  return ymdFromDateUTC(shifted(iso));
}

export function isFuture(ymd, nowIso = nowISO()) {
  return ymd > hojeObra(nowIso);
}

// 'HH:MM' <-> minutos
export function timeToMinutes(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function minutesToTime(min) {
  const total = Math.max(0, Math.round(min));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// Combina data de calendário e 'HH:MM' (fuso da obra) em instante ISO.
export function combineDateTime(ymd, hhmm = '00:00') {
  return new Date(`${ymd}T${hhmm.length === 4 ? `0${hhmm}` : hhmm}:00-03:00`).toISOString();
}

export function hoursBetween(isoA, isoB) {
  return (new Date(isoB).getTime() - new Date(isoA).getTime()) / (60 * MS_MIN);
}

export function addHours(iso, h) {
  return new Date(new Date(iso).getTime() + h * 60 * MS_MIN).toISOString();
}

export function ymOf(ymd) {
  return ymd.slice(0, 7);
}

export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function formatMonthYear(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

export function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Lista de datas 'YYYY-MM-DD' no intervalo fechado.
export function eachDay(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

// "há 3 h", "há 2 dias" — relativo a nowIso.
export function tempoRelativo(iso, nowIso = nowISO()) {
  const min = Math.max(0, Math.round((new Date(nowIso).getTime() - new Date(iso).getTime()) / MS_MIN));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'há 1 dia' : `há ${d} dias`;
}

// Duração 'HH:MM' a partir de minutos, ex.: 35 -> '00:35'.
export function formatDuracao(min) {
  return minutesToTime(min || 0);
}
