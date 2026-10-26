import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const TONES = {
  default: { bg: colors.surface, border: colors.border },
  soft: { bg: colors.blue50, border: colors.blue100 },
  gold: { bg: colors.gold50, border: colors.gold200 },
  warning: { bg: colors.warningBg, border: '#F1CFA3' },
  danger: { bg: colors.dangerBg, border: '#F3BDB6' },
  success: { bg: colors.successBg, border: '#B7E2C7' },
  info: { bg: colors.infoBg, border: '#B5DBF1' },
};

export const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  padded: { padding: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});

export const dinamico = {
  tom: (t) => ({ backgroundColor: t.bg, borderColor: t.border }),
};
