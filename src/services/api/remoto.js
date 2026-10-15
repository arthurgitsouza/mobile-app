import { ApiError } from './client.js';

// As rotas e a conversão das respostas serão ligadas aqui após o contrato da Pessoa 3.
export async function executarRemoto() {
  throw new ApiError({
    codigo: 'CONTRATO_PENDENTE',
    mensagem: 'A integração com o servidor ainda aguarda o contrato da API. Seus rascunhos continuam no aparelho.',
  });
}
