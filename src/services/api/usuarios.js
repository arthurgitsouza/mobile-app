export async function salvarUsuario(servico, args = {}) {
  return servico.executar('salvarUsuario', args);
}

export async function alternarUsuarioAtivo(servico, args = {}) {
  return servico.executar('alternarUsuarioAtivo', args);
}

export async function atualizarCanais(servico, args = {}) {
  return servico.executar('atualizarCanais', args);
}
