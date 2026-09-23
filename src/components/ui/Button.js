import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../../theme';
import Icon from './Icon';

const VARIANTS = {
  primary: { bg: colors.navy700, text: colors.white, border: colors.navy700 },
  accent: { bg: colors.gold500, text: colors.navy900, border: colors.gold500 },
  secondary: { bg: colors.white, text: colors.navy700, border: colors.navy700 },
  tonal: { bg: colors.blue100, text: colors.navy700, border: colors.blue100 },
  ghost: { bg: 'transparent', text: colors.navy600, border: 'transparent' },
  danger: { bg: colors.white, text: colors.danger, border: colors.danger },
  dangerSolid: { bg: colors.danger, text: colors.white, border: colors.danger },
  onDark: { bg: 'rgba(255,255,255,0.14)', text: colors.white, border: 'rgba(255,255,255,0.35)' },
};

const SIZES = {
  sm: { height: 40, px: 14, font: 14, icon: 18 },
  md: { height: 50, px: 18, font: 16, icon: 20 },
  lg: { height: 56, px: 22, font: 17, icon: 22 },
};

export default function Button({
  title, onPress, variant = 'primary', size = 'md', icon, iconRight, loading, disabled, full = true, style, accessibilityLabel, hint,
}) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { height: s.height, paddingHorizontal: s.px, backgroundColor: v.bg, borderColor: v.border },
        full ? styles.full : styles.auto,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={s.icon} color={v.text} /> : null}
          <Text style={[styles.text, { color: v.text, fontSize: s.font }]} numberOfLines={1}>
            {title}
          </Text>
          {iconRight ? <Icon name={iconRight} size={s.icon} color={v.text} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
