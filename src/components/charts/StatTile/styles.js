import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';
import { shadows } from '../../../theme/shadows';

export const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
    minHeight: 112,
  },
  destaque: { borderColor: colors.gold500, borderWidth: 2 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  value: { fontSize: 32, lineHeight: 38 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
});
