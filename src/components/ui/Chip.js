import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../../theme';
import Icon from './Icon';

// Chip selecionável (filtros e escolhas curtas). Área de toque ≥ 44 px de altura útil.
export default function Chip({ label, selected, onPress, icon, disabled, count, tone = 'navy', style }) {
  const bg = selected ? (tone === 'gold' ? colors.gold500 : colors.navy700) : colors.white;
  const fg = selected ? (tone === 'gold' ? colors.navy900 : colors.white) : colors.textMuted;
  const border = selected ? bg : colors.borderStrong;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg, borderColor: border }, disabled && { opacity: 0.4 }, pressed && { opacity: 0.85 }, style]}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
      {count != null ? (
        <Text style={[styles.count, { color: fg, opacity: 0.85 }]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5,
  },
  text: { fontSize: 14, fontWeight: '700' },
  count: { fontSize: 12, fontWeight: '800' },
});
