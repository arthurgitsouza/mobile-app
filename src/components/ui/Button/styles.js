import { StyleSheet } from 'react-native';
import { radius } from '../../../theme';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  full: { alignSelf: 'stretch' },
  auto: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  text: { fontWeight: '700', letterSpacing: 0.1, flexShrink: 1 },
});
