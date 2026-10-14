const CHAVE = 'rdo.token.v1';

export function criarSessaoSegura(storage) {
  let token = null;
  let versao = 0;
  let escrita = Promise.resolve();

  function gravar(operacao) {
    const tarefa = escrita.catch(() => {}).then(operacao);
    escrita = tarefa.catch(() => {});
    return tarefa;
  }

  return {
    getToken: () => token,

    async restaurar() {
      const atual = versao;
      await escrita;
      const salvo = await storage.getItemAsync(CHAVE);
      if (atual === versao) token = typeof salvo === 'string' && salvo ? salvo : null;
      return token;
    },

    async guardar(valor, manter = false) {
      if (typeof valor !== 'string' || !valor.trim()) {
        throw new Error('O servidor não informou um token válido.');
      }
      const atual = ++versao;
      await gravar(() => (manter ? storage.setItemAsync(CHAVE, valor) : storage.deleteItemAsync(CHAVE)));
      if (atual === versao) token = valor;
      return token;
    },

    async limpar() {
      versao++;
      token = null;
      await gravar(() => storage.deleteItemAsync(CHAVE));
    },
  };
}
