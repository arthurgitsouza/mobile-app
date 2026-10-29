import { ApiError } from '../erros.js';

// Rota prevista no contrato (docs/api.md) e ainda não implementada.
export const pendente = (rota) => (_req, _res, next) =>
  next(new ApiError(501, 'NAO_IMPLEMENTADO', `A rota ${rota} ainda não foi implementada no servidor.`));
