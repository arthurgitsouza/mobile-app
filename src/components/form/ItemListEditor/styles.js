import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  item: { padding: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  del: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
