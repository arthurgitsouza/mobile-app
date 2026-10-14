import test from 'node:test';
import assert from 'node:assert/strict';
import { criarCliente, ApiError } from '../src/services/api/client.js';

const baseURL = 'https://api.example.com';
const responder = (dados, status = 200) => new Response(dados == null ? null : JSON.stringify(dados), { status });

test('Envia JSON e o token de acesso', async () => {
  let enviada;
  const chamar = criarCliente({
    baseURL,
    getToken: () => 'token-teste',
    fetchImpl: async (url, opcoes) => {
      enviada = { url, ...opcoes };
      return responder({ id: 'rdo-1' });
    },
  });
  assert.deepEqual(
    await chamar('/rdos', {
      method: 'POST',
      body: { obraId: 'obra-1' },
    }),
    { id: 'rdo-1' },
  );
  assert.equal(enviada.url, `${baseURL}/rdos`);
  assert.equal(enviada.method, 'POST');
  assert.equal(enviada.headers.Authorization, 'Bearer token-teste');
  assert.equal(enviada.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(enviada.body), { obraId: 'obra-1' });
});

test('Preserva os erros de validação', async () => {
  const chamar = criarCliente({
    baseURL,
    fetchImpl: async () =>
      responder(
        {
          erro: {
            codigo: 'VALIDACAO',
            mensagem: 'Confira a data.',
            campos: { data: 'Data futura não permitida.' },
          },
        },
        422,
      ),
  });
  await assert.rejects(chamar('/rdos'), (erro) => {
    assert.ok(erro instanceof ApiError);
    assert.equal(erro.status, 422);
    assert.equal(erro.codigo, 'VALIDACAO');
    assert.equal(erro.mensagem, 'Confira a data.');
    assert.equal(erro.campos.data, 'Data futura não permitida.');
    return true;
  });
});

test('O erro 401 chama o encerramento da sessão', async () => {
  let tokenEncerrado;
  const chamar = criarCliente({
    baseURL,
    getToken: () => 'token-teste',
    onUnauthorized: (token) => {
      tokenEncerrado = token;
    },
    fetchImpl: async () => responder({ mensagem: 'Sessão expirada.' }, 401),
  });
  await assert.rejects(chamar('/rdos'), { status: 401 });
  assert.equal(tokenEncerrado, 'token-teste');
});

test('O erro 401 no login não encerra outra sessão', async () => {
  let encerramentos = 0;
  let enviada;
  const chamar = criarCliente({
    baseURL,
    getToken: () => 'token-teste',
    onUnauthorized: () => {
      encerramentos++;
    },
    fetchImpl: async (_, opcoes) => {
      enviada = opcoes;
      return responder({}, 401);
    },
  });
  await assert.rejects(chamar('/login', { autenticado: false }), { status: 401 });
  assert.equal(encerramentos, 0);
  assert.equal(enviada.headers.Authorization, undefined);
});

test('Cancela a chamada depois de 15 segundos mesmo se o fetch não responder', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let sinal;
  const chamar = criarCliente({
    baseURL,
    fetchImpl: (_, { signal }) => {
      sinal = signal;
      return new Promise(() => {});
    },
  });
  const chamada = chamar('/rdos');
  await Promise.resolve();
  t.mock.timers.tick(14999);
  assert.equal(sinal.aborted, false);
  t.mock.timers.tick(1);
  await assert.rejects(chamada, { codigo: 'TEMPO_LIMITE' });
  assert.equal(sinal.aborted, true);
});

test('Multipart mantém o corpo e deixa o boundary por conta do fetch', async () => {
  let enviada;
  const chamar = criarCliente({
    baseURL,
    fetchImpl: async (_, opcoes) => {
      enviada = opcoes;
      return responder({ ok: true });
    },
  });
  const body = new FormData();
  body.append('legenda', 'Foto da obra');
  await chamar('/fotos', { method: 'POST', body });
  assert.equal(enviada.body, body);
  assert.equal(enviada.headers['Content-Type'], undefined);
});

test('Trata falha de rede, resposta vazia e JSON inválido', async () => {
  await assert.rejects(
    criarCliente({
      baseURL,
      fetchImpl: async () => {
        throw new TypeError('Failed to fetch');
      },
    })('/rdos'),
    { codigo: 'REDE' },
  );
  assert.equal(
    await criarCliente({
      baseURL,
      fetchImpl: async () => responder(null, 204),
    })('/rdos'),
    null,
  );
  await assert.rejects(
    criarCliente({
      baseURL,
      fetchImpl: async () => new Response('<html>erro</html>'),
    })('/rdos'),
    { codigo: 'RESPOSTA_INVALIDA' },
  );
});

test('Exige o endereço da API', async () => {
  await assert.rejects(criarCliente({ baseURL: '' })('/rdos'), { codigo: 'CONFIGURACAO' });
});

test('Falha na limpeza do armazenamento não esconde o erro 401', async () => {
  const chamar = criarCliente({
    baseURL,
    onUnauthorized: async () => {
      throw new Error('Armazenamento indisponível');
    },
    fetchImpl: async () => responder({}, 401),
  });
  await assert.rejects(chamar('/rdos'), { status: 401 });
});
