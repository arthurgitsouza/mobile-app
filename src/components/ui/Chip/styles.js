import { StyleSheet } from 'react-native';
import { radius } from '../../../theme';

export const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  text: { fontSize: 14, fontWeight: '700' },
  count: { fontSize: 12, fontWeight: '800' },
});
