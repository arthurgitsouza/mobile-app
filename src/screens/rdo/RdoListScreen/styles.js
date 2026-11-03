import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  fabBtn: { paddingHorizontal: 22, height: 54, borderRadius: 27 },
  cal: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 },
  legenda: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 4 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot: { width: 12, height: 12, borderRadius: 6 },
  gap10MarginTop8: { gap: 10, marginTop: 8 },
  flex1: { flex: 1 },
  gap8PaddingRight16: { gap: 8, paddingRight: 16 },
  flexGrow0: { flexGrow: 0 },
  textAlignCenter: { textAlign: 'center' },
  rowGap10: { flexDirection: 'row', gap: 10 },
  flex13: { flex: 1.3 },
});

// Valores que dependem de props, estado ou do aparelho viram funções aqui mesmo.
export const dinamico = {
  fundoLegenda: (fundo, cor) => ({ backgroundColor: fundo ? colors.warningBg : cor }),
  bordaLegenda: (cor) => ({ borderWidth: 1, borderColor: cor }),
};
