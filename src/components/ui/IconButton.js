import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { colors } from '../../theme';
import Icon from './Icon';

// Alvo de toque de 44 px (RNF-05). `label` é obrigatório: descreve a ação para leitores de tela.
export default function IconButton({ icon, onPress, label, color = colors.navy700, size = 24, bg, badge, style, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, bg && { backgroundColor: bg }, pressed && { opacity: 0.6 }, disabled && { opacity: 0.4 }, style]}
    >
      <Icon name={icon} size={size} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 4, right: 3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.gold500, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.navy900 },
});
