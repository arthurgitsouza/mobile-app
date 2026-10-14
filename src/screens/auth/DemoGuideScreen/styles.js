import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  now: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});