// Este componente não possui estilos estáticos: tamanhos e cores vêm das props.
// Valores que só se sabem em tempo de execução ficam em funções.
export const dinamico = {
  preenchimento: (pct, cor, altura) => ({
    width: `${pct}%`,
    height: '100%',
    backgroundColor: cor,
    borderRadius: altura / 2,
  }),
  anel: (tamanho) => ({ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }),
};
