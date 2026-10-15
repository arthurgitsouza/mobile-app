import test from 'node:test';
import assert from 'node:assert/strict';
import { criarFilaOffline } from '../src/store/offline.js';

test('Reinício recupera a ordem da fila e não remove o item recusado', async () => {
  let state = { session: { userId: 'u1' }, filaOffline: [] };
  let salvo;
  let online = false;
  let recusar = true;
  const enviadas = [];
  const opcoes = {
    getState: () => state,
    commit: (next) => {
      state = next;
    },
    persistir: async () => {
      salvo = JSON.stringify(state);
    },
    isOnline: () => online,
    aplicar: (atual) => atual,
    enviar: async (item) => {
      enviadas.push(item.args.ordem);
      if (recusar) throw new Error('Servidor indisponível');
      return {};
    },
  };
  const fila = criarFilaOffline(opcoes);
  await fila.adicionar([
    { acao: 'enviarFoto', args: { ordem: 1 } },
    { acao: 'submeterRdo', args: { ordem: 2 } },
  ]);
  await fila.processar();
  assert.equal(enviadas.length, 0);
  state = JSON.parse(salvo);
  const restaurada = criarFilaOffline(opcoes);
  online = true;
  await assert.rejects(restaurada.processar());
  assert.deepEqual(enviadas, [1]);
  assert.equal(state.filaOffline.length, 2);
  assert.equal(state.filaOffline[0].tentativas, 1);
  recusar = false;
  await restaurada.processar();
  assert.deepEqual(enviadas, [1, 1, 2]);
  assert.equal(state.filaOffline.length, 0);
});

test('A fila não envia itens de outro usuário e duas sincronizações compartilham o envio', async () => {
  let state = { session: { userId: 'u1' }, filaOffline: [] };
  let chamadas = 0;
  let liberar;
  const fila = criarFilaOffline({
    getState: () => state,
    commit: (next) => {
      state = next;
    },
    persistir: async () => {},
    aplicar: (atual) => atual,
    enviar: async () => {
      chamadas++;
      await new Promise((resolve) => {
        liberar = resolve;
      });
      return {};
    },
  });
  await fila.adicionar([{ acao: 'enviarFoto', args: {} }]);
  state = { ...state, session: { userId: 'u2' } };
  await fila.processar();
  assert.equal(chamadas, 0);
  await fila.adicionar([{ acao: 'enviarFoto', args: {} }]);
  const primeira = fila.processar();
  const segunda = fila.processar();
  assert.equal(primeira, segunda);
  await new Promise(setImmediate);
  liberar();
  await primeira;
  assert.equal(chamadas, 1);
  assert.equal(state.filaOffline.length, 1);
  assert.equal(state.filaOffline[0].userId, 'u1');
});
