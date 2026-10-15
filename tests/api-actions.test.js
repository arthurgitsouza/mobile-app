import test from 'node:test';
import assert from 'node:assert/strict';
import { criarApi } from '../src/services/api/index.js';
import { criarMock } from '../src/services/api/mock.js';
import { criarSessaoSegura } from '../src/store/session.js';
import { gerarSeed } from '../src/data/seed.js';
import { ApiError } from '../src/services/api/client.js';

function preparar(opcoes = {}) {
  let state = {
    ...gerarSeed(),
    session: {
      userId: 'u_joao',
      ultimoUserId: 'u_joao',
      manter: false,
      biometria: {},
      termosAceitos: {},
    },
    filaOffline: [],
  };
  let salvo;
  let online = true;
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
  const api = criarApi({
    getState: () => state,
    commit: (next) => {
      state = next;
    },
    sessao,
    isOnline: () => online,
    persistir: async () => {
      salvo = JSON.parse(JSON.stringify(state));
    },
    ...opcoes,
  });
  return {
    api,
    sessao,
    state: () => state,
    salvo: () => salvo,
    online: (value) => {
      online = value;
    },
    trocar: (next) => {
      state = next;
    },
  };
}

test('O mock mantém o salvamento imediato para telas que ignoram a Promise', async () => {
  const app = preparar();
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  const tarefa = app.api.salvarRdo({ rdo: { ...rdo, observacoes: 'Texto salvo' } });
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoes, 'Texto salvo');
  assert.ok(tarefa instanceof Promise);
  assert.equal(await tarefa, app.state());
});

test('Login mock valida credenciais no serviço e guarda o token', async () => {
  const app = preparar();
  const user = app.state().users.find((u) => u.id === 'u_joao');
  await app.api.sair();
  await assert.rejects(app.api.entrar({ email: user.email, senha: 'incorreta' }), { codigo: 'CREDENCIAIS' });
  assert.equal(app.state().session.userId, null);
  await app.api.entrar({ email: user.email, senha: user.senha, manter: true });
  assert.equal(app.state().session.userId, user.id);
  assert.ok(app.sessao.getToken().startsWith('mock'));
  await app.api.sair();
  assert.equal(app.state().session.userId, null);
  assert.equal(app.sessao.getToken(), null);
});

test('Criar RDO usa o serviço e mantém a numeração local apenas no mock', async () => {
  const app = preparar();
  const antes = app.state().rdos.map((r) => r.id);
  const obra = app.state().obras[0];
  const resultado = await app.api.criarRdo({ obraId: obra.id, data: '2026-10-13', turno: 'diurno' });
  const novo = resultado.rdos.find((r) => !antes.includes(r.id));
  assert.ok(novo.id);
  assert.ok(novo.numero);
  assert.equal(novo.obraId, obra.id);
});

test('Recuperação mock confirma o código e impede reutilizar a redefinição', async () => {
  const app = preparar();
  const user = app.state().users.find((u) => u.id === 'u_joao');
  const rec = await app.api.solicitarRecuperacao({ email: user.email });
  await assert.rejects(app.api.verificarCodigo({ solicitacaoId: rec.solicitacaoId, codigo: '000000' }), {
    codigo: 'CODIGO_INVALIDO',
  });
  const verificado = await app.api.verificarCodigo({ solicitacaoId: rec.solicitacaoId, codigo: rec.codigoDemo });
  const args = { solicitacaoId: rec.solicitacaoId, resetToken: verificado.resetToken, senha: 'NovaSenha123' };
  await app.api.redefinirSenha(args);
  assert.equal(app.state().users.find((u) => u.id === user.id).senha, args.senha);
  assert.equal(app.state().session.userId, null);
  await assert.rejects(app.api.redefinirSenha(args), { codigo: 'CODIGO_EXPIRADO' });
});

test('Código mock expira em dez minutos e não é exposto com demonstração desativada', () => {
  let agora = 0;
  const mock = criarMock({ agora: () => agora });
  const state = gerarSeed();
  const email = state.users.find((u) => u.ativo).email;
  const rec = mock('solicitarRecuperacao', state, { email }).resultado;
  agora = 600000;
  assert.throws(() => mock('verificarCodigo', state, { solicitacaoId: rec.solicitacaoId, codigo: rec.codigoDemo }), {
    codigo: 'CODIGO_EXPIRADO',
  });
  assert.equal(criarMock({ demo: false })('solicitarRecuperacao', state, { email }).resultado.codigoDemo, undefined);
});

test('Código correto na quinta tentativa ainda permite redefinir a senha', async () => {
  const app = preparar();
  const user = app.state().users.find((u) => u.id === 'u_joao');
  const rec = await app.api.solicitarRecuperacao({ email: user.email });
  for (let i = 0; i < 4; i++) {
    await assert.rejects(app.api.verificarCodigo({ solicitacaoId: rec.solicitacaoId, codigo: '000000' }));
  }
  const confirmado = await app.api.verificarCodigo({ solicitacaoId: rec.solicitacaoId, codigo: rec.codigoDemo });
  await app.api.redefinirSenha({
    solicitacaoId: rec.solicitacaoId,
    resetToken: confirmado.resetToken,
    senha: 'NovaSenha123',
  });
  assert.equal(app.state().users.find((u) => u.id === user.id).senha, 'NovaSenha123');
});

test('Contrato ausente mostra erro e preserva rascunho e fila', async () => {
  const app = preparar({ useMock: false });
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  await assert.rejects(app.api.salvarRdo({ rdo: { ...rdo, observacoes: 'Não perder este texto' } }), {
    codigo: 'CONTRATO_PENDENTE',
  });
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoes, 'Não perder este texto');
  assert.equal(app.salvo().filaOffline.length, 1);
  assert.equal(app.state().filaOffline[0].tentativas, 1);
  assert.ok(app.state().filaOffline[0].erro);
});

test('Servidor indisponível mantém o item salvo para nova tentativa', async () => {
  const app = preparar({
    useMock: false,
    remoto: async () => {
      throw new ApiError();
    },
  });
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  await assert.rejects(app.api.salvarRdo({ rdo: { ...rdo, observacoes: 'Rascunho offline' } }), { codigo: 'REDE' });
  assert.equal(app.salvo().filaOffline[0].args.rdo.observacoes, 'Rascunho offline');
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoes, 'Rascunho offline');
});

test('Fila salva o RDO, depois as fotos, depois submete, e só confirma após a resposta', async () => {
  const enviadas = [];
  const app = preparar({
    useMock: false,
    preservarRdo: async (rdo) => ({
      ...rdo,
      fotos: rdo.fotos.map((f) => ({ ...f, uri: `file:///document/${f.id}.jpg` })),
    }),
    remoto: async (acao, args) => {
      enviadas.push(acao);
      if (acao === 'salvarRdo') return { alteracoes: { rdos: [args.rdo] } };
      if (acao === 'submeterRdo')
        return {
          alteracoes: {
            rdos: [
              {
                ...app.state().rdos.find((r) => r.id === args.rdoId),
                status: 'submetido',
                submetidoEm: 'data-do-servidor',
              },
            ],
          },
        };
      return {};
    },
  });
  app.online(false);
  const rdo = app.state().rdos.find((r) => r.status === 'devolvido');
  app.trocar({
    ...app.state(),
    rdos: app.state().rdos.map((r) =>
      r.id === rdo.id
        ? {
            ...r,
            fotos: r.fotos.map((f) => ({ ...f, envio: 'local' })),
          }
        : r,
    ),
  });
  await app.api.submeterRdo({ rdoId: rdo.id, userId: 'u_joao' });
  assert.equal(enviadas.length, 0);
  assert.equal(app.salvo().filaOffline.length, 5);
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).status, 'devolvido');
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).sync.pendente, true);
  app.online(true);
  await app.api.sincronizarPendentes();
  assert.deepEqual(enviadas, ['salvarRdo', 'enviarFoto', 'enviarFoto', 'enviarFoto', 'submeterRdo']);
  assert.equal(app.salvo().filaOffline.length, 0);
  const confirmado = app.state().rdos.find((r) => r.id === rdo.id);
  assert.equal(confirmado.status, 'submetido');
  assert.equal(confirmado.submetidoEm, 'data-do-servidor');
  assert.equal(confirmado.sync.pendente, false);
});

test('Falha ao gravar no aparelho impede iniciar o envio', async () => {
  let chamadas = 0;
  const app = preparar({
    useMock: false,
    persistir: async () => {
      throw new Error('Sem espaço');
    },
    remoto: async () => {
      chamadas++;
      return {};
    },
  });
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  await assert.rejects(app.api.salvarRdo({ rdo: { ...rdo, observacoes: 'Texto em memória' } }), /Sem espaço/);
  assert.equal(chamadas, 0);
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoes, 'Texto em memória');
});

test('Resposta atrasada não substitui um rascunho editado enquanto o envio estava em andamento', async () => {
  let liberar;
  let chamadas = 0;
  const app = preparar({
    useMock: false,
    remoto: async (_, args) => {
      chamadas++;
      if (chamadas === 1)
        await new Promise((resolve) => {
          liberar = resolve;
        });
      return { alteracoes: { rdos: [args.rdo] } };
    },
  });
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  const primeiro = app.api.salvarRdo({ rdo: { ...rdo, observacoes: 'Antes' } });
  await new Promise(setImmediate);
  const segundo = app.api.salvarRdo({ rdo: { ...rdo, observacoes: 'Depois' } });
  await new Promise(setImmediate);
  liberar();
  await Promise.all([primeiro, segundo]);
  assert.equal(chamadas, 2);
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoes, 'Depois');
});

test('Logout invalida uma resposta em andamento mesmo se o mesmo usuário voltar', async () => {
  let liberar;
  const app = preparar({
    useMock: false,
    remoto: async (_, args) => {
      await new Promise((resolve) => {
        liberar = resolve;
      });
      return { alteracoes: { rdos: [{ ...args.rdo, observacoes: 'Resposta antiga' }] } };
    },
  });
  const rdo = app.state().rdos.find((r) => r.status === 'rascunho');
  const envio = app.api.salvarRdo({ rdo: { ...rdo, observacoes: 'Atual' } });
  await new Promise(setImmediate);
  await app.api.sair();
  app.trocar({ ...app.state(), session: { ...app.state().session, userId: 'u_joao' } });
  liberar();
  await assert.rejects(envio, { codigo: 'SESSAO_ALTERADA' });
  assert.equal(app.state().rdos.find((r) => r.id === rdo.id).observacoes, 'Atual');
  assert.equal(app.state().filaOffline.length, 1);
});

test('Modo real rejeita acesso por userId e exige id e número oficiais ao criar RDO', async () => {
  const app = preparar({ useMock: false, remoto: async () => ({}) });
  await assert.rejects(app.api.entrar({ userId: 'u_joao' }), { codigo: 'CREDENCIAIS' });
  const quantidade = app.state().rdos.length;
  await assert.rejects(app.api.criarRdo({ obraId: app.state().obras[0].id, data: '2026-10-13', turno: 'diurno' }), {
    codigo: 'RESPOSTA_INVALIDA',
  });
  assert.equal(app.state().rdos.length, quantidade);
});
