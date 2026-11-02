// Este componente não possui estilos estáticos: posições e tamanhos vêm de cálculos.
// Valores que só se sabem em tempo de execução ficam em funções.
export const dinamico = {
  rotuloY: (largura, topo) => ({
    position: 'absolute',
    left: 0,
    width: largura,
    textAlign: 'right',
    top: topo,
    fontSize: 10,
  }),
  rotuloEsquerda: (esquerda, topo) => ({ position: 'absolute', left: esquerda, top: topo, fontSize: 10 }),
  rotuloDireita: (direita, topo) => ({ position: 'absolute', right: direita, top: topo, fontSize: 10 }),
  valorFinal: (direita, topo) => ({ position: 'absolute', right: direita, top: topo }),
};
