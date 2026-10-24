import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { criarCliente } from '../src/services/api/client.js';
import { criarApi } from '../src/services/api/index.js';
import { criarSessaoSegura } from '../src/store/session.js';
import { estadoServidorVazio } from '../src/store/apiState.js';

const require = createRequire(import.meta.url);
const { server } = require('../scripts/mock-server.js');
let baseURL;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

function preparar() {
  let state = estadoServidorVazio({
    userId: null,
    ultimoUserId: null,
    manter: false,
    biometria: {},
    termosAceitos: {},
    deviceId: 'teste-integracao',
  });
  const tokens = new Map();
  const sessao = criarSessaoSegura({
    getItemAsync: async (key) => tokens.get(key),
    setItemAsync: async (key, value) => {
      tokens.set(key, value);
    },
    deleteItemAsync: async (key) => {
      tokens.delete(key);
    },
  });
  let api;
  let encerramento;
  const http = criarCliente({
    baseURL,
    getToken: sessao.getToken,
    onUnauthorized: (token) => (token === sessao.getToken() ? api.sair() : undefined),
  });
  const request = (path, options) => {
    const resultado = http(path, options);
    if (path.endsWith('/auth/logout')) encerramento = resultado;
    return resultado;
  };
  api = criarApi({
    useMock: false,
    getState: () => state,
    commit: (next) => {
      state = next;
    },
    sessao,
    request,
  });
  return { api, sessao, state: () => state, request, encerramento: () => encerramento };
}

test('USE_MOCK=false: login e restauração carregam os dados do servidor do Francisco, sem senhas', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456', manter: true });
  const state = app.state();
  assert.equal(state.session.userId, 'u_master');
  assert.ok(state.obras.length > 0);
  assert.ok(state.rdos.length > 0);
  assert.ok(state.rdos.every((r) => Array.isArray(r.fotos) && Array.isArray(r.auditoria)));
  assert.ok(state.users.every((u) => u.senha === undefined));
  assert.ok(app.sessao.getToken());
  await app.api.restaurarSessao();
  assert.equal(app.state().session.userId, 'u_master');
});

test('USE_MOCK=false: senha incorreta não encerra uma sessão válida', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  const token = app.sessao.getToken();
  await assert.rejects(app.api.entrar({ email: 'master@planengen.com.br', senha: 'incorreta' }), {
    status: 401,
    codigo: 'CREDENCIAIS_INVALIDAS',
  });
  assert.equal(app.sessao.getToken(), token);
  assert.equal(app.state().session.userId, 'u_master');
});

test('USE_MOCK=false: marcar uma ou todas as notificações atualiza os dados confirmados pelo servidor', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  const notificacao = app.state().notifications[0];
  assert.ok(notificacao);
  await app.api.marcarNotificacaoLida({ id: notificacao.id });
  assert.equal(app.state().notifications.find((n) => n.id === notificacao.id).lida, true);
  await app.api.marcarTodasLidas({ userId: 'u_master' });
  assert.ok(app.state().notifications.every((n) => n.lida));
});

test('USE_MOCK=false: troca de perfil não mantém os usuários e a auditoria do master', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  const usuario = app.state().users.find((u) => u.id === 'u_joao');
  await app.api.sair();
  await app.encerramento();
  await app.api.entrar({ email: usuario.email, senha: '123456' });
  assert.equal(app.state().session.userId, 'u_joao');
  assert.deepEqual(
    app.state().users.map((u) => u.id),
    ['u_joao'],
  );
  assert.deepEqual(app.state().auditoriaGlobal, []);
  assert.deepEqual(app.state().academico.grupos, []);
});

test('USE_MOCK=false: logout invalida o token no servidor e remove a sessão do aparelho', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  const token = app.sessao.getToken();
  await app.api.sair();
  await app.encerramento();
  assert.equal(app.state().session.userId, null);
  assert.equal(app.sessao.getToken(), null);
  const resposta = await fetch(`${baseURL}/api/v1/auth/sessao`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(resposta.status, 401);
});

test('USE_MOCK=false: 401 protegido encerra a sessão', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  const token = app.sessao.getToken();
  await fetch(`${baseURL}/api/v1/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  await assert.rejects(app.api.restaurarSessao(), { status: 401 });
  assert.equal(app.state().session.userId, null);
  assert.equal(app.sessao.getToken(), null);
  await app.encerramento().catch(() => {});
});

test('USE_MOCK=false: escrita ainda não implementada no servidor mantém rascunho e fila', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  await assert.rejects(app.api.salvarRdo({ rdo: { ...rdo, observacoesGerais: 'Texto que não pode se perder' } }), {
    status: 501,
    codigo: 'NAO_IMPLEMENTADO',
  });
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoesGerais, 'Texto que não pode se perder');
  assert.equal(app.state().filaOffline.length, 1);
  assert.equal(app.state().filaOffline[0].erro.status, 501);
});

test('USE_MOCK=false: servidor ainda sem aceite e recuperação não confirma essas operações', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  await assert.rejects(app.api.aceitarTermos({ userId: 'u_master', opcoes: {} }), { status: 501 });
  assert.equal(app.state().session.termosAceitos.u_master, null);
  await assert.rejects(app.api.solicitarRecuperacao({ email: 'master@planengen.com.br' }), { status: 401 });
  assert.equal(app.state().session.userId, 'u_master');
});
