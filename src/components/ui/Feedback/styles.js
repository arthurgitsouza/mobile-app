import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md },
  bannerAction: { alignSelf: 'flex-start', paddingVertical: 4, minHeight: 32, justifyContent: 'center' },
});
