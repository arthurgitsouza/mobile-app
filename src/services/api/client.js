import { env } from '../../config/env.js';

export class ApiError extends Error {
  constructor({ status = 0, codigo = 'REDE', mensagem = 'Não foi possível conectar ao servidor.', campos = {} } = {}) {
    super(mensagem);
    this.name = 'ApiError';
    Object.assign(this, { status, codigo, mensagem, campos });
  }
}

export function normalizarErro(erro) {
  return erro instanceof ApiError ? erro : new ApiError({ mensagem: erro?.message });
}

export function criarCliente({
  baseURL,
  getToken = () => null,
  onUnauthorized = () => {},
  fetchImpl = (...args) => fetch(...args),
  timeout = 15000,
}) {
  return async function chamar(path, { method = 'GET', body, headers = {}, autenticado = true } = {}) {
    if (!/^https?:\/\//i.test(baseURL || '')) {
      throw new ApiError({
        codigo: 'CONFIGURACAO',
        mensagem: 'Configure EXPO_PUBLIC_API_URL para conectar ao servidor.',
      });
    }

    const controller = new AbortController();
    let timer;

    const limite = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new ApiError({
            codigo: 'TEMPO_LIMITE',
            mensagem: 'O servidor demorou para responder. Tente novamente.',
          }),
        );
        controller.abort();
      }, timeout);
    });

    try {
      const operacao = async () => {
        const token = autenticado ? await getToken() : null;
        if (controller.signal.aborted) throw new ApiError({ codigo: 'TEMPO_LIMITE' });
        const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
        const resposta = await fetchImpl(`${baseURL.replace(/\/+$/, '')}${path}`, {
          method,
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}),
        });

        if (resposta.status === 401 && autenticado) {
          try {
            await onUnauthorized(token);
          } catch {
            // O erro HTTP continua sendo 401 mesmo se a limpeza do armazenamento falhar.
          }
        }

        const texto = resposta.status === 204 ? '' : await resposta.text();
        let dados = null;
        if (texto) {
          try {
            dados = JSON.parse(texto);
          } catch {
            if (resposta.ok) {
              throw new ApiError({
                status: resposta.status,
                codigo: 'RESPOSTA_INVALIDA',
                mensagem: 'O servidor enviou uma resposta inválida.',
              });
            }
          }
        }

        if (!resposta.ok) {
          const detalhe = dados?.erro || dados || {};
          throw new ApiError({
            status: resposta.status,
            codigo: detalhe.codigo || `HTTP_${resposta.status}`,
            mensagem:
              detalhe.mensagem ||
              (resposta.status === 401
                ? 'Sua sessão expirou. Entre novamente.'
                : 'Não foi possível concluir a operação.'),
            campos: detalhe.campos || {},
          });
        }
        return dados;
      };

      return await Promise.race([operacao(), limite]);
    } catch (erro) {
      if (erro instanceof ApiError) throw erro;
      throw new ApiError();
    } finally {
      clearTimeout(timer);
    }
  };
}

export function request(path, options) {
  return criarCliente({ baseURL: env.API_URL })(path, options);
}
