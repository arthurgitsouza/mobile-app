export async function salvarAvaliacao(servico, args = {}) {
  return servico.executar('salvarAvaliacao', args);
}

export async function registrarEntregaAcademica(servico, args = {}) {
  return servico.executar('registrarEntregaAcademica', args);
}