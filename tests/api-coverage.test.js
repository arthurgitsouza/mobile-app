import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS } from '../src/store/actions.js';
import { modulosApi, recursos } from '../src/services/api/index.js';
import { acoesLocais, rotasRemotas } from '../src/services/api/remoto.js';

test('Nenhum módulo de recurso pode voltar a ficar vazio', () => {
  for (const [nome, modulo] of Object.entries(modulosApi)) {
    assert.ok(
      Object.values(modulo).some((fn) => typeof fn === 'function'),
      `Módulo vazio: ${nome}`,
    );
  }
});

test('Toda ação do store tem função assíncrona na API e encaminha o nome e os argumentos corretos', async () => {
  for (const nome of Object.keys(ACTIONS)) {
    assert.equal(typeof recursos[nome], 'function', `Falta a função API: ${nome}`);
    const args = { teste: nome };
    let recebida;
    const retorno = recursos[nome](
      {
        executar: (acao, parametros) => {
          recebida = { acao, parametros };
          return 'ok';
        },
      },
      args,
    );
    assert.ok(retorno instanceof Promise, `${nome} deve retornar Promise`);
    assert.equal(await retorno, 'ok');
    assert.equal(recebida.acao, nome);
    assert.equal(recebida.parametros, args);
  }
});

test('Toda ação do store tem rota do contrato ou uma decisão explícita de execução local', () => {
  for (const nome of Object.keys(ACTIONS)) {
    assert.ok(typeof rotasRemotas[nome] === 'function' || acoesLocais.has(nome), `Falta a rota: ${nome}`);
  }
});
