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