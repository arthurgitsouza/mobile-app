import { ApiError, normalizarErro } from '../services/api/client.js';
import { uid } from '../utils/format.js';

export function criarFilaOffline({
  getState,
  commit,
  persistir,
  enviar,
  isOnline = () => true,
  aplicar,
  getSessao = () => getState().session.userId,
}) {
  let sincronizacao = null;
  let inclusao = Promise.resolve();
  const itens = () => getState().filaOffline || [];

  function adicionar(operacoes) {
    const userId = getState().session.userId;
    const sessao = getSessao();
    if (!userId) return Promise.reject(new ApiError({ status: 401, mensagem: 'Entre novamente para enviar.' }));
    const novos = operacoes.map(({ acao, args }) => ({
      id: uid('fila'),
      acao,
      args: JSON.parse(JSON.stringify(args)),
      criadoEm: new Date().toISOString(),
      tentativas: 0,
      userId,
    }));
    const tarefa = inclusao
      .catch(() => {})
      .then(async () => {
        if (getSessao() !== sessao) throw new ApiError({ status: 401, mensagem: 'A sessão foi alterada.' });
        commit({ ...getState(), filaOffline: [...itens(), ...novos] });
        await persistir();
        return novos;
      });
    inclusao = tarefa.catch(() => {});
    return tarefa;
  }

  async function drenar() {
    await inclusao;
    const userId = getState().session.userId;
    const sessao = getSessao();
    if (!userId || !isOnline()) return getState();
    while (isOnline() && getSessao() === sessao) {
      const item = itens().find((x) => x.userId === userId);
      if (!item) break;
      commit({
        ...getState(),
        filaOffline: itens().map((x) => (x.id === item.id ? { ...x, tentativas: x.tentativas + 1, erro: null } : x)),
      });
      await persistir();
      try {
        const resposta = await enviar(item);
        if (getSessao() !== sessao) throw new ApiError({ status: 401, mensagem: 'A sessão foi alterada.' });
        const posteriores = itens().filter((x) => x.id !== item.id);
        const next = aplicar(getState(), resposta, item, posteriores);
        commit({ ...next, filaOffline: posteriores });
        await persistir();
      } catch (erro) {
        const e = normalizarErro(erro);
        commit({
          ...getState(),
          filaOffline: itens().map((x) =>
            x.id === item.id
              ? {
                  ...x,
                  erro: { status: e.status, codigo: e.codigo, mensagem: e.mensagem, campos: e.campos },
                }
              : x,
          ),
        });
        await persistir();
        throw e;
      }
    }
    return getState();
  }

  function processar() {
    if (sincronizacao) return sincronizacao;
    sincronizacao = drenar().finally(() => {
      sincronizacao = null;
    });
    return sincronizacao;
  }

  return { adicionar, processar };
}
