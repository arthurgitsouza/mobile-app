import { StyleSheet } from 'react-native';
import { colors } from '../../../../theme';

export const styles = StyleSheet.create({
  gap8: { gap: 8 },
  rowGap10: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  flex13: { flex: 1.3 },
  alignItemsCenter: { alignItems: 'center' },
  gap6BackgroundColorBlue50: { gap: 6, backgroundColor: colors.blue50, borderRadius: 12, padding: 12 },
});
