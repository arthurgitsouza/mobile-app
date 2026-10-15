export async function entrar(servico, args = {}) {
  return servico.executar('entrar', args);
}

export async function sair(servico, args = {}) {
  return servico.executar('sair', args);
}

export async function aceitarTermos(servico, args = {}) {
  return servico.executar('aceitarTermos', args);
}

export async function definirBiometria(servico, args = {}) {
  return servico.executar('definirBiometria', args);
}

export async function alterarSenha(servico, args = {}) {
  return servico.executar('alterarSenha', args);
}

export async function solicitarRecuperacao(servico, args = {}) {
  return servico.executar('solicitarRecuperacao', args);
}

export async function verificarCodigo(servico, args = {}) {
  return servico.executar('verificarCodigo', args);
}

export async function redefinirSenha(servico, args = {}) {
  return servico.executar('redefinirSenha', args);
}

export async function restaurarSessao(servico, args = {}) {
  return servico.executar('restaurarSessao', args);
}
