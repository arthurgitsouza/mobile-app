export async function criarRdo(servico, args = {}) {
  return servico.executar('criarRdo', args);
}

export async function salvarRdo(servico, args = {}) {
  return servico.executar('salvarRdo', args);
}

export async function submeterRdo(servico, args = {}) {
  return servico.executar('submeterRdo', args);
}

export async function sincronizarPendentes(servico, args = {}) {
  return servico.executar('sincronizarPendentes', args);
}

export async function registrarVisualizacao(servico, args = {}) {
  return servico.executar('registrarVisualizacao', args);
}

export async function iniciarAnalise(servico, args = {}) {
  return servico.executar('iniciarAnalise', args);
}

export async function devolverRdo(servico, args = {}) {
  return servico.executar('devolverRdo', args);
}

export async function editarComoMaster(servico, args = {}) {
  return servico.executar('editarComoMaster', args);
}

export async function enviarAoCliente(servico, args = {}) {
  return servico.executar('enviarAoCliente', args);
}

export async function retificarRdo(servico, args = {}) {
  return servico.executar('retificarRdo', args);
}

export async function cancelarRdo(servico, args = {}) {
  return servico.executar('cancelarRdo', args);
}

export async function excluirRdo(servico, args = {}) {
  return servico.executar('excluirRdo', args);
}