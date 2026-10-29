import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { styles, dinamico, VARIANTS, SIZES } from './styles';
import Icon from '../Icon';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  full = true,
  style,
  accessibilityLabel,
  hint,
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
        dinamico.base(s, v),
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
          <Text style={[styles.text, dinamico.texto(s, v)]} numberOfLines={1}>
            {title}
          </Text>
          {iconRight ? <Icon name={iconRight} size={s.icon} color={v.text} /> : null}
        </>
      )}
    </Pressable>
  );
}
