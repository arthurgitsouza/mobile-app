import { env } from '../../config/env.js';
import { ApiError } from './client.js';
import { executarMock } from './mock.js';

import * as auth from './auth.js';
import * as obras from './obras.js';
import * as rdos from './rdos.js';
import * as comentarios from './comentarios.js';
import * as usuarios from './usuarios.js';
import * as notificacoes from './notificacoes.js';
import * as assinaturas from './assinaturas.js';
import * as cadastros from './cadastros.js';
import * as relatorios from './relatorios.js';
import * as academico from './academico.js';

const recursos = {
  ...auth,
  ...obras,
  ...rdos,
  ...comentarios,
  ...usuarios,
  ...notificacoes,
  ...assinaturas,
  ...cadastros,
  ...relatorios,
  ...academico,
};

export function criarApi({
  getState,
  commit,
  useMock = env.USE_MOCK,
  onError = () => {},
}) {
  async function executar(nome, args) {
    if (!useMock) {
      throw new ApiError({
        codigo: 'ETAPA_INICIAL',
        mensagem: 'Por enquanto, mantenha o modo mock ativado.',
      });
    }

    const atual = getState();
    const novo = executarMock(nome, atual, args);

    if (novo !== atual) {
      commit(novo);
    }

    return novo;
  }

  const servico = { executar };
  const api = {};

  Object.entries(recursos).forEach(([nome, funcao]) => {
    api[nome] = (args = {}) => {
      const resultado = funcao(servico, args);
      resultado.catch(onError);
      return resultado;
    };
  });

  return api;
}