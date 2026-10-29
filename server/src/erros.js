// Erros no formato que o app espera (src/services/api/client.js): { codigo, mensagem, campos? }.
export class ApiError extends Error {
  constructor(status, codigo, mensagem, campos) {
    super(mensagem);
    Object.assign(this, { status, codigo, mensagem, campos });
  }
}

export const naoEncontrado = (o = 'Registro') => new ApiError(404, 'NAO_ENCONTRADO', `${o} não encontrado.`);
export const proibido = (m = 'Você não tem permissão para esta ação.') => new ApiError(403, 'PROIBIDO', m);
export const validacao = (campos, m = 'Revise os campos obrigatórios.') => new ApiError(422, 'VALIDACAO', m, campos);

// Converte erro do Supabase em ApiError, sem expor detalhes internos ao app.
export function erroDoBanco(erro) {
  console.error('[supabase]', erro?.message || erro);
  return new ApiError(500, 'ERRO_BANCO', 'Não foi possível acessar o banco de dados.');
}

export function tratarErros(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ codigo: err.codigo, mensagem: err.mensagem, ...(err.campos ? { campos: err.campos } : {}) });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ codigo: 'JSON_INVALIDO', mensagem: 'O corpo da requisição não é um JSON válido.' });
  }
  console.error(err);
  return res.status(500).json({ codigo: 'ERRO_INTERNO', mensagem: 'Erro inesperado no servidor.' });
}
