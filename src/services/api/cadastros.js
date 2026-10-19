export async function salvarCliente(servico, args = {}) {
  return servico.executar('salvarCliente', args);
}

export async function salvarEmpresa(servico, args = {}) {
  return servico.executar('salvarEmpresa', args);
}

export async function salvarCatalogo(servico, args = {}) {
  return servico.executar('salvarCatalogo', args);
}

export async function atualizarConfiguracoes(servico, args = {}) {
  return servico.executar('atualizarConfiguracoes', args);
}

export async function resetarDemo(servico, args = {}) {
  return servico.executar('resetarDemo', args);
}
