import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { colors } from '../../../theme';
import Icon from '../Icon';
import { styles, dinamico } from './styles';

// Alvo de toque de 44 px (RNF-05). `label` é obrigatório: descreve a ação para leitores de tela.
export default function IconButton({
  icon,
  onPress,
  label,
  color = colors.navy700,
  size = 24,
  bg,
  badge,
  style,
  disabled,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        bg && dinamico.fundo(bg),
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
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
