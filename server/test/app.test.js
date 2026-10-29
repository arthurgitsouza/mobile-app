// Testes do esqueleto da API, sem banco: rodam no CI sem precisar das chaves do Supabase.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

for (const k of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY']) delete process.env[k];
const { criarApp } = await import('../src/app.js');

let servidor;
let base;
before(async () => {
  servidor = criarApp().listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://localhost:${servidor.address().port}/api/v1`;
});
after(() => servidor.close());

test('health responde e avisa que o banco não está configurado', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, modo: 'supabase', banco: 'nao_configurado' });
});

test('rota inexistente devolve 404 no formato de erro do app', async () => {
  const r = await fetch(`${base}/nao-existe`);
  assert.equal(r.status, 404);
  assert.equal((await r.json()).codigo, 'ROTA_INEXISTENTE');
});

test('rota protegida sem banco devolve 503 em vez de quebrar', async () => {
  const r = await fetch(`${base}/obras`, { headers: { Authorization: 'Bearer x' } });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).codigo, 'BANCO_NAO_CONFIGURADO');
});

test('login valida campos obrigatórios antes de ir ao banco', async () => {
  const r = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email":"x"}',
  });
  assert.equal(r.status, 503);
});

test('JSON inválido devolve 400', async () => {
  const r = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).codigo, 'JSON_INVALIDO');
});

test('todas as 73 rotas do contrato existem (respondem algo diferente de ROTA_INEXISTENTE)', async () => {
  const { readFileSync } = await import('node:fs');
  const contrato = readFileSync(new URL('../../docs/api.md', import.meta.url), 'utf8');
  const rotas = new Set(
    [...contrato.matchAll(/\b(GET|POST|PUT|PATCH|DELETE) (\/[a-zA-Z0-9/{}:_-]+)/g)].map(
      ([, m, p]) =>
        `${m} ${p
          .replace(/rdo_[a-z0-9_]+/g, 'x')
          .replace(/\{\w+\}/g, 'x')
          .replace(/\/$/, '')}`,
    ),
  );
  for (const rota of rotas) {
    const [m, p] = rota.split(' ');
    const r = await fetch(base + p, { method: m, headers: { Authorization: 'Bearer x' } });
    const corpo = r.status === 204 ? {} : await r.json();
    assert.notEqual(corpo.codigo, 'ROTA_INEXISTENTE', `${rota} não está registrada`);
  }
});
