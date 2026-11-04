import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  acoes: { flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gap14: { gap: 14 },
  flex1: { flex: 1 },
  alignItemsCenterGap8: { alignItems: 'center', gap: 8 },
  textAlignCenter: { textAlign: 'center' },
  fontWeight800: { fontWeight: '800' },
});

// Valores que dependem de props, estado ou do aparelho viram funções aqui mesmo.
export const dinamico = {
  colunaFoto: (tile) => ({ width: tile, gap: 4 }),
};
