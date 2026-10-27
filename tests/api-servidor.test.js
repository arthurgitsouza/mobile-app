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
  let online = true;
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
    isOnline: () => online,
  });
  return {
    api,
    sessao,
    state: () => state,
    request,
    encerramento: () => encerramento,
    online: (valor) => {
      online = valor;
    },
  };
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

test('USE_MOCK=false: escrita rejeitada pelo servidor mantém rascunho e fila', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  let rejeicao;
  await assert.rejects(
    app.api.salvarRdo({ rdo: { ...rdo, observacoesGerais: 'Texto que não pode se perder' } }),
    (erro) => {
      rejeicao = erro;
      // A main antiga não tem a rota; a pessoa-3 rejeita a edição pelo master.
      return (
        (erro.status === 501 && erro.codigo === 'NAO_IMPLEMENTADO') ||
        (erro.status === 403 && erro.codigo === 'SEM_PERMISSAO')
      );
    },
  );
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoesGerais, 'Texto que não pode se perder');
  assert.equal(app.state().filaOffline.length, 1);
  assert.equal(app.state().filaOffline[0].erro.status, rejeicao.status);
});

test('USE_MOCK=false: servidor ainda sem aceite e recuperação não confirma essas operações', async () => {
  const app = preparar();
  await app.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  await assert.rejects(app.api.aceitarTermos({ userId: 'u_master', opcoes: {} }), { status: 501 });
  assert.equal(app.state().session.termosAceitos.u_master, null);
  await assert.rejects(app.api.solicitarRecuperacao({ email: 'master@planengen.com.br' }), { status: 401 });
  assert.equal(app.state().session.userId, 'u_master');
});

async function criarRdoNoServidor(t, app, data) {
  await app.api.entrar({ email: 'operacional@planengen.com.br', senha: '123456' });
  const obra = app.state().obras.find((o) => o.usuarioIds.includes('u_joao'));
  try {
    await app.api.criarRdo({ obraId: obra.id, data, turno: 'diurno' });
  } catch (erro) {
    if (erro.status !== 501) throw erro;
    t.skip('A main ainda não recebeu as escritas da branch pessoa-3.');
    return null;
  }
  const rdo = app.state().rdos.find((r) => r.data === data && r.obraId === obra.id);
  assert.ok(rdo?.id);
  assert.ok(rdo.numero > 0);
  return rdo;
}

const assinaturaTeste = {
  tracos: [
    [
      { x: 1, y: 1 },
      { x: 20, y: 15 },
    ],
  ],
  largura: 300,
  altura: 100,
};

test('USE_MOCK=false: cria, sincroniza edições offline, submete, devolve, valida e recebe a manifestação do cliente', async (t) => {
  const operacional = preparar();
  const novo = await criarRdoNoServidor(t, operacional, '2020-01-11');
  if (!novo) return;
  const rdoId = novo.id;
  const atual = () => operacional.state().rdos.find((r) => r.id === rdoId);
  const preenchido = {
    ...novo,
    identificacao: { ...novo.identificacao, responsavelPreenchimento: 'João Ribeiro' },
    clima: {
      ...novo.clima,
      periodos: { ...novo.clima.periodos, manha: { condicao: 'ensolarado', temperatura: '28' } },
    },
    atividades: [{ id: 'a1', servico: 'Concretagem', unidade: 'm3', quantidadeDia: '12,5' }],
    declaracao: { aceita: true },
    assinaturaOperacional: assinaturaTeste,
    observacoesGerais: 'Primeiro salvamento',
  };
  await operacional.api.salvarRdo({ rdo: preenchido });
  assert.equal(atual().observacoesGerais, 'Primeiro salvamento');
  assert.equal(atual().atividades[0].quantidadeDia, '12.5');
  operacional.online(false);
  await operacional.api.salvarRdo({ rdo: { ...atual(), observacoesGerais: 'Primeira edição offline' } });
  await operacional.api.salvarRdo({ rdo: { ...atual(), observacoesGerais: 'Segunda edição offline' } });
  assert.equal(operacional.state().filaOffline.length, 2);
  operacional.online(true);
  await operacional.api.sincronizarPendentes();
  assert.equal(operacional.state().filaOffline.length, 0);
  assert.equal(atual().observacoesGerais, 'Segunda edição offline');
  await operacional.api.submeterRdo({ rdoId });
  assert.equal(atual().status, 'submetido');
  assert.equal(atual().sync.pendente, false);
  const master = preparar();
  await master.api.entrar({ email: 'master@planengen.com.br', senha: '123456' });
  await master.api.devolverRdo({ rdoId, motivo: 'Detalhar observação' });
  await operacional.api.restaurarSessao();
  assert.equal(atual().status, 'devolvido');
  assert.equal(atual().devolucao.por, 'u_master');
  await operacional.api.salvarRdo({ rdo: { ...atual(), observacoesGerais: 'Observação corrigida' } });
  await operacional.api.submeterRdo({ rdoId });
  await master.api.restaurarSessao();
  await master.api.validarEAssinar({ rdoId, assinatura: assinaturaTeste, enviarAgora: true });
  const validado = master.state().rdos.find((r) => r.id === rdoId);
  assert.equal(validado.status, 'enviado_cliente');
  assert.ok(validado.hashTecnico);
  const cliente = preparar();
  await cliente.api.entrar({ email: 'cliente@horizonte.com.br', senha: '123456' });
  await cliente.api.comentarRdo({ rdoId, texto: 'Conferido pelo cliente', contexto: 'geral' });
  const comentado = cliente.state().rdos.find((r) => r.id === rdoId);
  assert.equal(comentado.comentarios.at(-1).autorId, 'u_fernanda');
  await cliente.api.assinarComoCliente({ rdoId, tipo: 'ciencia', assinatura: assinaturaTeste });
  const finalizado = cliente.state().rdos.find((r) => r.id === rdoId);
  assert.equal(finalizado.status, 'finalizado');
  assert.ok(finalizado.hashFinal);
  assert.ok(finalizado.auditoria.every((evento) => evento.evento));
});

test('USE_MOCK=false: edição em outro aparelho gera conflito e preserva o rascunho local', async (t) => {
  const primeiro = preparar();
  const novo = await criarRdoNoServidor(t, primeiro, '2020-01-12');
  if (!novo) return;
  const segundo = preparar();
  await segundo.api.entrar({ email: 'operacional@planengen.com.br', senha: '123456' });
  await primeiro.api.salvarRdo({ rdo: { ...novo, observacoesGerais: 'Gravado no primeiro aparelho' } });
  const desatualizado = segundo.state().rdos.find((r) => r.id === novo.id);
  await assert.rejects(
    segundo.api.salvarRdo({ rdo: { ...desatualizado, observacoesGerais: 'Rascunho no segundo aparelho' } }),
    { status: 409, codigo: 'CONFLITO' },
  );
  assert.equal(segundo.state().rdos.find((r) => r.id === novo.id).observacoesGerais, 'Rascunho no segundo aparelho');
  assert.equal(segundo.state().filaOffline.length, 1);
  const salvo = await segundo.request(`/api/v1/rdos/${novo.id}`);
  assert.equal(salvo.observacoesGerais, 'Gravado no primeiro aparelho');
});
