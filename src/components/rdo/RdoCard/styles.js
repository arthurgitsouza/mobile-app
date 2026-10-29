import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: { flexDirection: 'row', overflow: 'hidden' },
  bar: { width: 5 },
  body: { flex: 1, padding: 12, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counts: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  count: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
});
