import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../../theme';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, gap: 12 },
  icon: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textAlignCenter: { textAlign: 'center' },
  flex1: { flex: 1 },
});
