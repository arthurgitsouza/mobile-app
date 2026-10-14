import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import { request, ApiError } from '../src/services/api/client.js';

const urlOriginal = env.API_URL;

beforeEach(() => {
  env.API_URL = 'https://api.example.com';
});

afterEach(() => {
  env.API_URL = urlOriginal;
});

test('Envia JSON e devolve os dados do servidor', async (t) => {
  let enviada;

  t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
    enviada = { url, ...opcoes };
    return new Response(JSON.stringify({ id: 'rdo-1' }));
  });

  const resultado = await request('/rdos', {
    method: 'POST',
    body: { obraId: 'obra-1' },
  });

  assert.deepEqual(resultado, { id: 'rdo-1' });
  assert.equal(enviada.url, 'https://api.example.com/rdos');
  assert.equal(enviada.method, 'POST');
  assert.deepEqual(JSON.parse(enviada.body), { obraId: 'obra-1' });
});

test('Preserva os erros de validação', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return new Response(
      JSON.stringify({
        codigo: 'VALIDACAO',
        mensagem: 'Confira a data.',
        campos: { data: 'Data futura não permitida.' },
      }),
      { status: 422 },
    );
  });

  await assert.rejects(request('/rdos'), (erro) => {
    assert.ok(erro instanceof ApiError);
    assert.equal(erro.status, 422);
    assert.equal(erro.codigo, 'VALIDACAO');
    assert.equal(erro.campos.data, 'Data futura não permitida.');
    return true;
  });
});

test('Retorna o erro 401 do servidor', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return new Response(
      JSON.stringify({ mensagem: 'Sessão expirada.' }),
      { status: 401 },
    );
  });

  await assert.rejects(request('/rdos'), {
    status: 401,
    mensagem: 'Sessão expirada.',
  });
});

test('Cancela a chamada depois de 15 segundos', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  let sinal;

  t.mock.method(globalThis, 'fetch', (_, { signal }) => {
    sinal = signal;

    return new Promise((resolve, reject) => {
      signal.addEventListener(
        'abort',
        () => reject(signal.reason),
        { once: true },
      );
    });
  });

  const chamada = request('/rdos');

  t.mock.timers.tick(14999);
  assert.equal(sinal.aborted, false);

  t.mock.timers.tick(1);

  await assert.rejects(chamada, {
    codigo: 'TEMPO_LIMITE',
  });

  assert.equal(sinal.aborted, true);
});