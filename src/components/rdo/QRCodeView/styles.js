// Este componente não possui estilos estáticos: o tamanho e as cores vêm das props.
// Valores que só se sabem em tempo de execução ficam em funções.
export const dinamico = {
  caixa: (tamanho, fundo) => ({ width: tamanho, height: tamanho, backgroundColor: fundo }),
};
