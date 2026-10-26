import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  gold: { backgroundColor: colors.gold50, borderColor: colors.gold500 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  letter: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterGold: { backgroundColor: colors.gold600 },
  letterText: { fontWeight: '800' },
  titles: { flex: 1, gap: 2 },
  body: { marginTop: 12, gap: 10 },
});
