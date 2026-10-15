// Gera docs/exemplos/*.json a partir de gerarSeed().
// Serve de exemplo de payload para o contrato da API (docs/api.md) e de carga inicial do banco.
//
// Uso:
//   node scripts/exportar-seed.js                 -> data de referência fixa (saída estável)
//   node scripts/exportar-seed.js --agora=2026-10-13T15:00:00.000Z
//
// Observação: o seed guarda a senha de demonstração em texto puro (campo `senha`). Ela NÃO faz
// parte do contrato: o servidor guarda apenas o hash e nenhuma resposta da API devolve senha.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gerarSeed, SCHEMA_VERSION } from '../src/data/seed.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, '..', 'docs', 'exemplos');
const AGORA_PADRAO = '2026-10-13T15:00:00.000Z';

const arg = process.argv.find((a) => a.startsWith('--agora='));
const agora = arg ? arg.slice('--agora='.length) : AGORA_PADRAO;
if (Number.isNaN(new Date(agora).getTime())) {
  console.error(`Data inválida em --agora: ${agora}`);
  process.exit(1);
}

const seed = gerarSeed(agora);

// Usuários sem o campo `senha` (no servidor existe apenas senhaHash).
const usuarios = seed.users.map(({ senha, ...resto }) => resto);

const arquivos = {
  'empresa.json': seed.empresa,
  'clientes.json': seed.clientes,
  'usuarios.json': usuarios,
  'obras.json': seed.obras,
  'rdos.json': seed.rdos,
  'notificacoes.json': seed.notifications,
  'auditoria-global.json': seed.auditoriaGlobal,
  'catalogos.json': seed.catalogos,
  'configuracoes.json': seed.settings,
  'academico.json': seed.academico,
};

mkdirSync(SAIDA, { recursive: true });
for (const [nome, conteudo] of Object.entries(arquivos)) {
  writeFileSync(join(SAIDA, nome), JSON.stringify(conteudo, null, 2) + '\n', 'utf8');
}

console.log(`Seed v${SCHEMA_VERSION} gerado com data de referência ${agora}`);
for (const [nome, conteudo] of Object.entries(arquivos)) {
  const qtd = Array.isArray(conteudo) ? `${conteudo.length} registros` : 'objeto';
  console.log(`  docs/exemplos/${nome} (${qtd})`);
}
