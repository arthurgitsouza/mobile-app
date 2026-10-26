import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  plain: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  on: { borderColor: colors.navy600, backgroundColor: colors.blue50 },
});
