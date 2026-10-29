import { StyleSheet } from 'react-native';
import { radius } from '../../../theme';

export const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  small: { paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  text: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
});
