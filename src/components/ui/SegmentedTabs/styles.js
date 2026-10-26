import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';
import { shadows } from '../../../theme/shadows';

export const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.grayBg, borderRadius: radius.md, padding: 4, gap: 4 },
  tab: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
  },
  active: { backgroundColor: colors.white },
  text: { fontSize: 13.5, fontWeight: '700', color: colors.textMuted },
  textActive: { color: colors.navy700 },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 11, fontWeight: '800', color: colors.navy800 },
});
