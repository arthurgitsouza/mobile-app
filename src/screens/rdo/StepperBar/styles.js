import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

// Estado visual de cada etapa: atual, completa, com pendência obrigatória, com aviso ou ainda vazia.
export const ESTILO = {
  completo: { bg: colors.success, fg: colors.white, icon: 'check' },
  atencao: { bg: colors.warning, fg: colors.white, icon: 'alert-outline' },
  erro: { bg: colors.danger, fg: colors.white, icon: 'exclamation-thick' },
  vazio: { bg: 'rgba(255,255,255,0.16)', fg: colors.white, icon: null },
};

export const styles = StyleSheet.create({
  row: { gap: 6, paddingRight: 8 },
  item: { width: 66, alignItems: 'center', gap: 2, paddingVertical: 2 },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  label: { fontSize: 11, textAlign: 'center' },
  letra: { fontSize: 10, letterSpacing: 0.5, opacity: 0.85 },
  gap8MarginTop6: { gap: 8, marginTop: 6 },
  borderColorGold200: { borderColor: colors.gold200 },
  fontWeight800: { fontWeight: '800' },
  rowAlignItemsCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex1: { flex: 1 },
});

// Valores que dependem de props, estado ou do aparelho viram funções aqui mesmo.
export const dinamico = {
  fundoEtapa: (atual, s) => ({ backgroundColor: atual ? colors.gold500 : s.bg }),
};
