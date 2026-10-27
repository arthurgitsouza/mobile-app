import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  simHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  okIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  codeBox: {
    width: 48,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeActive: { borderColor: colors.navy600, borderWidth: 2.5 },
  hiddenInput: { position: 'absolute', opacity: 0.01, height: 1, width: 1 },

  simCard: { gap: 6 },
  codigoGerado: { letterSpacing: 6 },
  acoes: { alignItems: 'center' },
  linkAcao: { minHeight: 40, justifyContent: 'center' },
  regrasCard: { gap: 8 },
  sucesso: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  centro: { textAlign: 'center' },
  codeWrap: { gap: 6 },
  codeErro: { borderColor: colors.danger },
});
