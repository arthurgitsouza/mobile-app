import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  pad: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: '#FBFCFE',
    overflow: 'hidden',
  },
  hint: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  x: { position: 'absolute', left: 12, bottom: 34 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 4 },
});
