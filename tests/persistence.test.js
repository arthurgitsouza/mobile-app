import test from 'node:test';
import assert from 'node:assert/strict';
import { criarGravador } from '../src/store/persistenceCore.js';

test('Persistência: grava juntas as fatias alteradas e aguarda confirmação', async () => {
  const escritas = [];
  const g = criarGravador({
    gravar: async (batch) => {
      escritas.push(batch);
    },
  });
  g.agendar({ rdos: ['a'] });
  g.agendar({ filaOffline: ['b'] });
  await g.flush({ strict: true });
  assert.deepEqual(escritas, [{ rdos: ['a'], filaOffline: ['b'] }]);
  await g.limpar();
});

test('Persistência: falta de espaço é informada e os dados podem ser gravados de novo', async () => {
  let falhar = true;
  let salvo;
  const g = criarGravador({
    gravar: async (batch) => {
      if (falhar) throw new Error('Disco cheio');
      salvo = batch;
    },
  });
  g.agendar({ filaOffline: ['não perder'] });
  await assert.rejects(g.flush({ strict: true }), /Não foi possível salvar/);
  falhar = false;
  await g.flush({ strict: true });
  assert.deepEqual(salvo, { filaOffline: ['não perder'] });
  await g.limpar();
});

test('Persistência: gravação antiga que falha não sobrescreve versão mais nova', async () => {
  let rejeitar;
  let primeira = true;
  const escritas = [];
  const g = criarGravador({
    gravar: async (batch) => {
      if (primeira) {
        primeira = false;
        return new Promise((_, reject) => {
          rejeitar = reject;
        });
      }
      escritas.push(batch);
    },
  });
  g.agendar({ rdos: ['antigo'] });
  const antiga = g.flush({ strict: true });
  const rejeicao = assert.rejects(antiga);
  await new Promise((resolve) => setImmediate(resolve));
  g.agendar({ rdos: ['novo'] });
  const nova = g.flush({ strict: true });
  rejeitar(new Error('Disco cheio'));
  await rejeicao;
  await nova;
  await g.flush({ strict: true });
  assert.deepEqual(escritas, [{ rdos: ['novo'] }]);
  await g.limpar();
});
