export async function comentarRdo(servico, args = {}) {
  return servico.executar('comentarRdo', args);
}