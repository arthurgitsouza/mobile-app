// Serializa gravações e só repõe uma fatia que falhou se ela não recebeu uma versão mais nova.
export function criarGravador({ gravar, atraso = 450 }) {
  let pendente = {};
  let revisoes = {};
  let timer;
  let escrita = Promise.resolve();

  function agendar(fatias) {
    for (const [key, value] of Object.entries(fatias)) {
      pendente[key] = value;
      revisoes[key] = (revisoes[key] || 0) + 1;
    }
    clearTimeout(timer);
    timer = setTimeout(() => flush(), atraso);
  }

  async function flush({ strict = false } = {}) {
    clearTimeout(timer);
    const batch = pendente;
    const versoes = { ...revisoes };
    pendente = {};
    if (Object.keys(batch).length) {
      escrita = escrita
        .catch(() => {})
        .then(() => gravar(batch))
        .catch((erro) => {
          for (const [key, value] of Object.entries(batch)) {
            if (revisoes[key] === versoes[key] && !(key in pendente)) pendente[key] = value;
          }
          throw erro;
        });
      escrita.catch(() => {});
    }
    try {
      await escrita;
    } catch (erro) {
      if (strict)
        throw new Error('Não foi possível salvar no aparelho. Libere espaço e tente novamente.', { cause: erro });
    }
  }

  async function limpar() {
    clearTimeout(timer);
    pendente = {};
    revisoes = Object.fromEntries(Object.entries(revisoes).map(([key, versao]) => [key, versao + 1]));
    await escrita.catch(() => {});
  }

  return { agendar, flush, limpar };
}
