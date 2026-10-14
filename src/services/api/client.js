import { env } from '../../config/env.js';

export class ApiError extends Error {
  constructor({
    status = 0,
    codigo = 'REDE',
    mensagem = 'Não foi possível conectar ao servidor.',
    campos = {},
  } = {}) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.mensagem = mensagem;
    this.campos = campos;
  }
}

export async function request(
  path,
  { method = 'GET', body, headers = {} } = {},
) {
  if (!env.API_URL) {
    throw new ApiError({
      codigo: 'CONFIGURACAO',
      mensagem: 'O endereço da API não foi configurado.',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const resposta = await fetch(
      `${env.API_URL.replace(/\/+$/, '')}${path}`,
      {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && {
            'Content-Type': 'application/json',
          }),
          ...headers,
        },
        ...(body !== undefined && {
          body: JSON.stringify(body),
        }),
      },
    );

    const texto = await resposta.text();
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
      const erro = dados?.erro || dados || {};

      throw new ApiError({
        status: resposta.status,
        codigo: erro.codigo || `HTTP_${resposta.status}`,
        mensagem: erro.mensagem || 'Não foi possível concluir a operação.',
        campos: erro.campos || {},
      });
    }

    return dados;
  } catch (erro) {
    if (controller.signal.aborted) {
      throw new ApiError({
        codigo: 'TEMPO_LIMITE',
        mensagem: 'O servidor demorou para responder. Tente novamente.',
      });
    }

    if (erro instanceof ApiError) throw erro;

    throw new ApiError();
  } finally {
    clearTimeout(timer);
  }
}