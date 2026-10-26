import React from 'react';
import { Pressable, View } from 'react-native';
import { shadows } from '../../../theme/shadows';
import { styles, dinamico, TONES } from './styles';

export default function Card({
  children,
  style,
  onPress,
  padded = true,
  tone = 'default',
  accessibilityLabel,
  hint,
  flat,
}) {
  const t = TONES[tone];
  const base = [styles.card, dinamico.tom(t), !flat && shadows.card, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={hint}
        style={({ pressed }) => [...base, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}
