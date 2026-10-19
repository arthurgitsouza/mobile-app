export async function registrarExportacao(servico, args = {}) {
  return servico.executar('registrarExportacao', args);
}

export async function registrarPdf(servico, args = {}) {
  return servico.executar('registrarPdf', args);
}
