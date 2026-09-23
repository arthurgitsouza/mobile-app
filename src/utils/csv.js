// CSV para Excel/Power BI (RF-18): separador ";" e aspas duplas; números com vírgula decimal (pt-BR).

const escapa = (v) => {
  const s = v === null || v === undefined ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// colunas: [{ chave, titulo }]
export function paraCsv(linhas, colunas) {
  const cab = colunas.map((c) => escapa(c.titulo)).join(';');
  const corpo = linhas.map((l) => colunas.map((c) => escapa(typeof c.chave === 'function' ? c.chave(l) : l[c.chave])).join(';'));
  return [cab, ...corpo].join('\r\n');
}
