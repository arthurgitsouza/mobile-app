import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const VARIANTS = {
  primary: { bg: colors.navy700, text: colors.white, border: colors.navy700 },
  accent: { bg: colors.gold500, text: colors.navy900, border: colors.gold500 },
  secondary: { bg: colors.white, text: colors.navy700, border: colors.navy700 },
  tonal: { bg: colors.blue100, text: colors.navy700, border: colors.blue100 },
  ghost: { bg: 'transparent', text: colors.navy600, border: 'transparent' },
  danger: { bg: colors.white, text: colors.danger, border: colors.danger },
  dangerSolid: { bg: colors.danger, text: colors.white, border: colors.danger },
  onDark: { bg: 'rgba(255,255,255,0.14)', text: colors.white, border: 'rgba(255,255,255,0.35)' },
};

export const SIZES = {
  sm: { height: 40, px: 14, font: 14, icon: 18 },
  md: { height: 50, px: 18, font: 16, icon: 20 },
  lg: { height: 56, px: 22, font: 17, icon: 22 },
};

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

// Valores que dependem das props (tamanho e variante) viram funções aqui mesmo.
export const dinamico = {
  base: (s, v) => ({
    height: s.height,
    paddingHorizontal: s.px,
    backgroundColor: v.bg,
    borderColor: v.border,
  }),
  texto: (s, v) => ({ color: v.text, fontSize: s.font }),
};
