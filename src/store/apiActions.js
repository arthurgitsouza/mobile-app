import { ACTIONS } from './actions.js';
import { criarFilaOffline } from './offline.js';
import { aplicarResposta } from './apiState.js';
import { validarRdo } from '../domain/validation.js';
import { uid } from '../utils/format.js';
import { ApiError, normalizarErro } from '../services/api/client.js';
import { criarMock } from '../services/api/mock.js';
import { executarRemoto } from '../services/api/remoto.js';

const recuperacao = new Set(['solicitarRecuperacao', 'verificarCodigo', 'redefinirSenha']);

export function criarActions({
  recursos,
  getState,
  commit,
  sessao,
  request,
  useMock = true,
  demo = true,
  remoto = executarRemoto,
  isOnline = () => true,
  persistir = async () => {},
  preservarRdo = async (rdo) => rdo,
  onError = () => {},
}) {
  const mock = criarMock({ demo });
  let geracao = 0;
  let envios = Promise.resolve();

  const publicar = (next) => {
    commit(next);
    return next;
  };
  const garantirSessao = (inicio) => {
    if (inicio !== geracao)
      throw new ApiError({
        status: 401,
        codigo: 'SESSAO_ALTERADA',
        mensagem: 'A sessão foi alterada. Entre novamente.',
      });
  };

  async function chamar(nome, args, itemId) {
    const inicio = geracao;
    const resposta = await remoto(nome, args, { request, itemId, getState });
    garantirSessao(inicio);
    if (!resposta || typeof resposta !== 'object')
      throw new ApiError({
        codigo: 'RESPOSTA_INVALIDA',
        mensagem: 'O servidor não confirmou a operação.',
      });
    return resposta;
  }

  const fila = criarFilaOffline({
    getState,
    commit,
    persistir,
    isOnline,
    getSessao: () => `${geracao}:${getState().session.userId}`,
    enviar: (item) => chamar(item.acao, item.args, item.id),
    aplicar: (atual, resposta, item, posteriores) => {
      const rdoId = item.args.rdoId || item.args.rdo?.id;
      if (item.acao === 'submeterRdo' && !resposta.alteracoes?.rdos?.some((r) => r.id === rdoId)) {
        throw new ApiError({ codigo: 'RESPOSTA_INVALIDA', mensagem: 'O servidor não confirmou o envio do RDO.' });
      }
      let next = aplicarResposta(atual, resposta);
      const fotosPendentes = posteriores.filter((x) => x.acao === 'enviarFoto' && x.args.rdoId === rdoId);
      if (fotosPendentes.length) {
        next.rdos = next.rdos.map((r) => {
          if (r.id !== rdoId) return r;
          const fotos = [...r.fotos];
          for (const pendente of fotosPendentes) {
            const foto = pendente.args.foto;
            if (!fotos.some((f) => f.id === foto.id || f.idLocal === foto.id)) fotos.push(foto);
          }
          return { ...r, fotos };
        });
      }
      if (posteriores.some((x) => x.acao === 'salvarRdo' && x.args.rdo.id === rdoId)) {
        const rdo = atual.rdos.find((r) => r.id === rdoId);
        next.rdos = next.rdos.map((r) => (r.id === rdoId ? rdo : r));
      }
      if (item.acao === 'enviarFoto') {
        next.rdos = next.rdos.map((r) =>
          r.id === rdoId
            ? { ...r, fotos: r.fotos.map((f) => (f.id === item.args.foto.id ? { ...f, envio: 'enviada' } : f)) }
            : r,
        );
      }
      if (posteriores.some((x) => x.acao === 'submeterRdo' && x.args.rdoId === rdoId)) {
        next.rdos = next.rdos.map((r) =>
          r.id === rdoId
            ? {
                ...r,
                sync: { ...r.sync, pendente: true },
              }
            : r,
        );
      }
      if (item.acao === 'submeterRdo') {
        next.rdos = next.rdos.map((r) => (r.id === rdoId ? { ...r, sync: { ...r.sync, pendente: false } } : r));
      }
      return next;
    },
  });

  async function encerrar() {
    geracao++;
    publicar(ACTIONS.sair(getState()));
    await sessao?.limpar();
    return getState();
  }

  function prepararEnvio(operacao) {
    const inicio = geracao;
    const tarefa = envios
      .catch(() => {})
      .then(async () => {
        garantirSessao(inicio);
        const resultado = await operacao(inicio);
        garantirSessao(inicio);
        return resultado;
      });
    envios = tarefa.catch(() => {});
    return tarefa;
  }

  async function executar(nome, args = {}) {
    if (!getState()) throw new ApiError({ codigo: 'CARREGANDO', mensagem: 'Aguarde o carregamento do aplicativo.' });
    if (nome === 'sair') {
      const token = sessao?.getToken();
      if (!useMock && request && token) {
        remoto('sair', {}, { request, getState, token }).catch(() => {});
      }
      return encerrar();
    }
    if (nome === 'resetarDemo' && (!useMock || !demo))
      throw new ApiError({ status: 403, mensagem: 'Demonstração desativada.' });
    if (nome === 'entrar' && args.userId && !useMock)
      throw new ApiError({
        status: 401,
        codigo: 'CREDENCIAIS',
        mensagem: 'Entre com e-mail e senha.',
      });

    if (useMock) {
      const inicio = geracao;
      const resultado = mock(nome, getState(), args);
      if (resultado.token) {
        await sessao?.guardar(resultado.token, !!args.manter);
        garantirSessao(inicio);
        publicar(ACTIONS.entrar(getState(), { ...args, userId: resultado.usuario.id }));
      } else if (resultado.state !== getState()) publicar(resultado.state);
      if (nome === 'redefinirSenha') await sessao?.limpar();
      return recuperacao.has(nome) ? resultado.resultado || { ok: true } : getState();
    }

    if (nome === 'processarLembretes') return getState();
    if (nome === 'definirBiometria') return publicar(ACTIONS.definirBiometria(getState(), args));
    if (nome === 'atualizarConfiguracoes' && Object.keys(args.patch || {}).every((key) => key === 'forceOffline'))
      return publicar(ACTIONS.atualizarConfiguracoes(getState(), args));

    if (nome === 'sincronizarPendentes') return fila.processar();

    if (['salvarRdo', 'submeterRdo', 'enviarFoto'].includes(nome)) {
      if (!getState().session.userId) throw new ApiError({ status: 401, mensagem: 'Entre novamente para enviar.' });
      if (nome === 'salvarRdo') {
        const antes = getState();
        const rdo = antes.rdos.find((r) => r.id === args.rdo?.id);
        if (!rdo || rdo.sync?.pendente) return antes;
        const next = ACTIONS.salvarRdo(antes, args);
        if (next === antes) return antes;
        publicar(next);
      }
      await prepararEnvio(async (inicio) => {
        if (nome === 'enviarFoto') {
          const guardado = await preservarRdo({ fotos: [args.foto] });
          garantirSessao(inicio);
          await fila.adicionar([{ acao: nome, args: { ...args, foto: guardado.fotos[0] } }]);
          return;
        }
        const atual = getState();
        const rdo = atual.rdos.find((r) => r.id === (args.rdoId || args.rdo?.id));
        if (!rdo) throw new ApiError({ status: 404, mensagem: 'O RDO não foi encontrado.' });
        if (nome === 'submeterRdo') {
          if (rdo.sync?.pendente) return;
          if (!['rascunho', 'devolvido'].includes(rdo.status))
            throw new ApiError({ status: 422, mensagem: 'Este RDO não pode ser enviado.' });
          const validacao = validarRdo(rdo, { obra: atual.obras.find((o) => o.id === rdo.obraId), rdos: atual.rdos });
          if (!validacao.valido)
            throw new ApiError({
              status: 422,
              codigo: 'VALIDACAO',
              mensagem: 'Revise os campos obrigatórios do RDO.',
              campos: Object.fromEntries(validacao.erros.map((e) => [e.campo, e.mensagem])),
            });
        }
        const salvo = await preservarRdo(rdo);
        garantirSessao(inicio);
        publicar({
          ...getState(),
          rdos: getState().rdos.map((r) =>
            r.id === salvo.id
              ? {
                  ...r,
                  fotos: r.fotos.map((f) => ({ ...f, uri: salvo.fotos.find((x) => x.id === f.id)?.uri || f.uri })),
                }
              : r,
          ),
        });
        const operacoes = [{ acao: 'salvarRdo', args: { rdo: salvo } }];
        if (nome === 'submeterRdo') {
          for (const foto of salvo.fotos.filter((f) => f.envio !== 'enviada')) {
            operacoes.push({ acao: 'enviarFoto', args: { rdoId: salvo.id, foto } });
          }
          operacoes.push({ acao: nome, args: { rdoId: salvo.id, userId: atual.session.userId } });
        }
        await fila.adicionar(operacoes);
        if (nome === 'submeterRdo')
          publicar({
            ...getState(),
            rdos: getState().rdos.map((r) => (r.id === salvo.id ? { ...r, sync: { ...r.sync, pendente: true } } : r)),
          });
        await persistir();
      });
      if (!isOnline()) return getState();
      return fila.processar();
    }

    if (nome !== 'entrar' && !recuperacao.has(nome) && nome !== 'restaurarSessao' && !getState().session.userId) {
      throw new ApiError({ status: 401, mensagem: 'Entre novamente para continuar.' });
    }
    const inicio = geracao;
    const dados = await chamar(nome, args, uid('req'));
    if (nome === 'entrar' || nome === 'restaurarSessao') {
      if (!dados.usuario?.id || (nome === 'entrar' && !dados.token))
        throw new ApiError({
          codigo: 'RESPOSTA_INVALIDA',
          mensagem: 'O servidor não confirmou a sessão.',
        });
      if (nome === 'entrar') await sessao.guardar(dados.token, !!args.manter);
      garantirSessao(inicio);
      const next = aplicarResposta(getState(), {
        ...dados,
        alteracoes: {
          ...dados.alteracoes,
          users: [...(dados.alteracoes?.users || []).filter((u) => u.id !== dados.usuario.id), dados.usuario],
        },
      });
      const idsPendentes = new Set(
        (getState().filaOffline || [])
          .filter((item) => item.userId === dados.usuario.id)
          .map((item) => item.args.rdoId || item.args.rdo?.id),
      );
      const rascunhos = getState().rdos.filter((r) => idsPendentes.has(r.id) && r.autorId === dados.usuario.id);
      next.rdos = [...next.rdos.filter((r) => !rascunhos.some((local) => local.id === r.id)), ...rascunhos];
      return publicar({
        ...next,
        session: {
          ...next.session,
          userId: dados.usuario.id,
          ultimoUserId: dados.usuario.id,
          manter: nome === 'entrar' ? !!args.manter : next.session.manter,
          termosAceitos: { ...next.session.termosAceitos, [dados.usuario.id]: dados.termosAceitos || null },
        },
      });
    }
    if (nome === 'redefinirSenha') await encerrar();
    if (recuperacao.has(nome)) return dados;
    const next = aplicarResposta(getState(), dados);
    if (
      nome === 'criarRdo' &&
      !next.rdos.some(
        (r) => r.obraId === args.obraId && r.numero && !getState().rdos.some((antigo) => antigo.id === r.id),
      )
    )
      throw new ApiError({
        codigo: 'RESPOSTA_INVALIDA',
        mensagem: 'O servidor não devolveu o identificador e o número do RDO.',
      });
    if (nome === 'aceitarTermos') {
      if (!dados.aceite?.em)
        throw new ApiError({ codigo: 'RESPOSTA_INVALIDA', mensagem: 'O servidor não confirmou o aceite.' });
      next.session = {
        ...next.session,
        termosAceitos: { ...next.session.termosAceitos, [next.session.userId]: dados.aceite },
      };
    }
    return publicar(next);
  }

  const servico = { executar };
  const api = {};
  for (const [nome, funcao] of Object.entries(recursos)) {
    api[nome] = (args = {}) => {
      const resultado = funcao(servico, args);
      resultado.catch((erro) => onError(normalizarErro(erro)));
      return resultado;
    };
  }
  return api;
}
