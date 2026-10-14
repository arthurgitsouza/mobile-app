export async function enviarFoto(servico, args = {}) {
  return servico.executar('enviarFoto', args);
}
