import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../../theme';

export const styles = StyleSheet.create({
  resumo: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  num: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gap8: { gap: 8 },
  textAlignCenterFontWeight700: { textAlign: 'center', fontWeight: '700' },
  rowGap10: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  flex18: { flex: 1.8 },
  gap14: { gap: 14 },
  gap4: { gap: 4 },
  paddingHorizontal12: { paddingHorizontal: 12 },
  borderTopWidth1BorderTopColorDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
});
