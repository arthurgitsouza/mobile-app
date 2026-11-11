import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  readout: { minHeight: 40, gap: 1 },
  grade: { position: 'absolute', left: 0, right: 0, height: 1 },
  colunas: { ...StyleSheet.absoluteFill, flexDirection: 'row', alignItems: 'flex-end' },
  slot: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  pilha: { width: '62%', maxWidth: 24, justifyContent: 'flex-end' },
  topo: { fontSize: 10, fontWeight: '800', color: colors.text, marginBottom: 2 },
  eixoX: { flex: 1, alignItems: 'center', paddingTop: 4 },
  rot: { fontSize: 9.5, lineHeight: 12 },
  vao: { height: 2 },
  raiz: { gap: 8 },
  tique: { fontSize: 10 },
  ocupa: { flex: 1 },
  eixoXLinha: { flexDirection: 'row', height: 30 },
});

// Valores que só se sabem em tempo de execução ficam em funções.
export const dinamico = {
  segmento: (altura, cor, arredondar) => ({
    height: altura,
    backgroundColor: cor,
    ...(arredondar ? { borderTopLeftRadius: 4, borderTopRightRadius: 4 } : null),
  }),
  corpo: (altura) => ({ flexDirection: 'row', height: altura }),
  eixoY: (altura) => ({
    width: 40,
    height: altura,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  }),
  area: (altura) => ({ height: altura }),
};
