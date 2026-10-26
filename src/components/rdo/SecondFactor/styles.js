import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ok: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    minHeight: 54,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.white,
  },
});
