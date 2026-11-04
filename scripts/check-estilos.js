// Confere o padrão de docs/estrutura.md: nenhum arquivo de tela ou componente (fora do
// styles.js) pode ter `StyleSheet.create` nem `style={{ … }}` (inclui contentContainerStyle={{ … }}).
//
// Uso: npm run check:estilos   (sai com código 1 se achar alguma violação)
//
// PENDENTES lista as pastas que ainda não foram convertidas. Elas aparecem como aviso e não
// derrubam o CI. Ao converter uma pasta, apague a linha dela daqui: a partir daí ela é cobrada.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTAS = ['src/screens', 'src/components'];
const PENDENTES = [];

const REGRAS = [
  { re: /StyleSheet\.create/, motivo: 'StyleSheet.create fora do styles.js' },
  { re: /[sS]tyle=\{\{/, motivo: 'estilo inline ({{ … }})' },
];

function listarJs(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const caminho = join(pasta, e.name);
    if (e.isDirectory()) return listarJs(caminho);
    return e.name.endsWith('.js') && e.name !== 'styles.js' ? [caminho] : [];
  });
}

function violacoes(arquivo) {
  const achados = [];
  readFileSync(arquivo, 'utf8')
    .split('\n')
    .forEach((linha, i) => {
      if (linha.trim().startsWith('//')) return;
      for (const { re, motivo } of REGRAS) {
        if (re.test(linha)) achados.push({ linha: i + 1, motivo, trecho: linha.trim() });
      }
    });
  return achados;
}

const pendente = (rel) => PENDENTES.some((p) => rel === p || rel.startsWith(`${p}/`));

let erros = 0;
let avisos = 0;
for (const pasta of PASTAS) {
  for (const arquivo of listarJs(join(raiz, pasta))) {
    const rel = relative(raiz, arquivo).split(sep).join('/');
    const achados = violacoes(arquivo);
    if (achados.length === 0) continue;
    if (pendente(rel)) {
      avisos += achados.length;
      continue;
    }
    for (const a of achados) {
      erros += 1;
      console.error(`${rel}:${a.linha}  ${a.motivo}\n    ${a.trecho}`);
    }
  }
}

if (avisos > 0) console.warn(`Pendentes (ainda fora do padrão, não contam como erro): ${avisos}`);
if (erros > 0) {
  console.error(`\n${erros} violação(ões) do padrão de docs/estrutura.md.`);
  process.exit(1);
}
console.log('check:estilos: ok');
