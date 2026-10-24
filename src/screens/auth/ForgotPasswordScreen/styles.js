import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  codigoTexto: { letterSpacing: 6 },
  codigoErro: { borderColor: colors.danger },
  centralizado: { alignItems: 'center' },
  centro: { textAlign: 'center' },
  link: { minHeight: 40, justifyContent: 'center' },
  sucesso: { alignItems: 'center', gap: 10, paddingVertical: 24 },
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
});
