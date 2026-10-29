import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  comment: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctx: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.blue100,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vis: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  audit: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 32 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trilho: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  diff: { backgroundColor: colors.gold50, borderRadius: 8, padding: 8, gap: 2, marginTop: 4 },
});
