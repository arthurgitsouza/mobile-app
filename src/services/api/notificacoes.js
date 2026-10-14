export async function reenviarNotificacaoCliente(servico, args = {}) {
  return servico.executar('reenviarNotificacaoCliente', args);
}

export async function reenviarEntrega(servico, args = {}) {
  return servico.executar('reenviarEntrega', args);
}

export async function marcarNotificacaoLida(servico, args = {}) {
  return servico.executar('marcarNotificacaoLida', args);
}

export async function marcarTodasLidas(servico, args = {}) {
  return servico.executar('marcarTodasLidas', args);
}

export async function processarLembretes(servico, args = {}) {
  return servico.executar('processarLembretes', args);
}