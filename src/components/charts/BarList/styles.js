import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valor: { width: 78, textAlign: 'right' },
  lista: { gap: 12 },
  ocupa: { flex: 1 },
});

// Valores que só se sabem em tempo de execução ficam em funções.
export const dinamico = {
  rotulo: (largura) => ({ width: largura, flexDirection: 'row', gap: 6, alignItems: 'center' }),
  trilha: (altura) => ({ flex: 1, height: altura, justifyContent: 'center' }),
  pilha: (pct, minimo) => ({ flexDirection: 'row', width: `${pct}%`, minWidth: minimo }),
  segmento: (fatia, altura, cor, comVao, ultimo) => ({
    flex: fatia,
    height: altura,
    backgroundColor: cor,
    marginRight: comVao ? 2 : 0,
    borderTopRightRadius: ultimo ? 4 : 0,
    borderBottomRightRadius: ultimo ? 4 : 0,
  }),
  barra: (pct, minimo, altura, cor) => ({
    width: `${pct}%`,
    minWidth: minimo,
    height: altura,
    backgroundColor: cor,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  }),
};
