import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { shadows } from '../../theme/shadows';

const TONES = {
  default: { bg: colors.surface, border: colors.border },
  soft: { bg: colors.blue50, border: colors.blue100 },
  gold: { bg: colors.gold50, border: colors.gold200 },
  warning: { bg: colors.warningBg, border: '#F1CFA3' },
  danger: { bg: colors.dangerBg, border: '#F3BDB6' },
  success: { bg: colors.successBg, border: '#B7E2C7' },
  info: { bg: colors.infoBg, border: '#B5DBF1' },
};

export default function Card({ children, style, onPress, padded = true, tone = 'default', accessibilityLabel, hint, flat }) {
  const t = TONES[tone];
  const base = [styles.card, { backgroundColor: t.bg, borderColor: t.border }, !flat && shadows.card, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={hint}
        style={({ pressed }) => [...base, pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  padded: { padding: 16 },
});
