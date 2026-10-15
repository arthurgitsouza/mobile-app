import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSessaoSegura } from '../src/store/session.js';

function criarStorage() {
  const valores = new Map();
  return {
    valores,
    getItemAsync: async (key) => valores.get(key) || null,
    setItemAsync: async (key, value) => {
      valores.set(key, value);
    },
    deleteItemAsync: async (key) => {
      valores.delete(key);
    },
  };
}

test('Restaura o token quando manter conectado está ativo', async () => {
  const storage = criarStorage();
  const sessao = criarSessaoSegura(storage);
  await sessao.guardar('token-teste', true);
  assert.equal(sessao.getToken(), 'token-teste');
  assert.equal(await criarSessaoSegura(storage).restaurar(), 'token-teste');
});

test('Sem manter conectado o token fica somente na memória', async () => {
  const storage = criarStorage();
  const sessao = criarSessaoSegura(storage);
  await sessao.guardar('token-antigo', true);
  await sessao.guardar('token-atual', false);
  assert.equal(sessao.getToken(), 'token-atual');
  assert.equal(await criarSessaoSegura(storage).restaurar(), null);
});

test('Sair remove o token da memória e do armazenamento', async () => {
  const storage = criarStorage();
  const sessao = criarSessaoSegura(storage);
  await sessao.guardar('token-teste', true);
  const limpeza = sessao.limpar();
  assert.equal(sessao.getToken(), null);
  await limpeza;
  assert.equal(await criarSessaoSegura(storage).restaurar(), null);
});

test('Um login ainda sendo salvo não reabre uma sessão encerrada', async () => {
  const storage = criarStorage();
  let liberar;
  storage.setItemAsync = (key, value) =>
    new Promise((resolve) => {
      liberar = () => {
        storage.valores.set(key, value);
        resolve();
      };
    });
  const sessao = criarSessaoSegura(storage);
  const login = sessao.guardar('token-teste', true);
  await Promise.resolve();
  await Promise.resolve();
  const limpeza = sessao.limpar();
  liberar();
  await Promise.all([login, limpeza]);
  assert.equal(sessao.getToken(), null);
  assert.equal(storage.valores.size, 0);
});

test('Uma restauração atrasada não reabre a sessão após sair', async () => {
  const storage = criarStorage();
  let liberar;
  storage.getItemAsync = () =>
    new Promise((resolve) => {
      liberar = () => resolve('token-antigo');
    });
  const sessao = criarSessaoSegura(storage);
  const restauracao = sessao.restaurar();
  await Promise.resolve();
  await sessao.limpar();
  liberar();
  assert.equal(await restauracao, null);
  assert.equal(sessao.getToken(), null);
});

test('Falha no armazenamento não confirma o login', async () => {
  const storage = criarStorage();
  storage.setItemAsync = async () => {
    throw new Error('Sem espaço');
  };
  const sessao = criarSessaoSegura(storage);
  await assert.rejects(sessao.guardar('token-teste', true), /Sem espaço/);
  assert.equal(sessao.getToken(), null);
});
