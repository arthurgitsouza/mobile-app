import { StyleSheet } from 'react-native';
import { radius } from '../../../theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 56,
  },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  kv: { gap: 2 },
  kvInline: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 2, gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32, alignSelf: 'flex-start' },
});
