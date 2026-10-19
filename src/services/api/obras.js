export async function salvarObra(servico, args = {}) {
  return servico.executar('salvarObra', args);
}
