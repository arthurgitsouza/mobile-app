export async function validarEAssinar(servico, args = {}) {
  return servico.executar('validarEAssinar', args);
}

export async function assinarComoCliente(servico, args = {}) {
  return servico.executar('assinarComoCliente', args);
}