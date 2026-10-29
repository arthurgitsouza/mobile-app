import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  week: { flexDirection: 'row', marginBottom: 2 },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    paddingVertical: 6,
  },
  row: { flexDirection: 'row' },
  cell: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: colors.navy600 },
  missing: { backgroundColor: colors.warningBg },
  selected: { backgroundColor: colors.navy700, borderColor: colors.navy700 },
  dayText: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  dots: { flexDirection: 'row', gap: 2, height: 6, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
