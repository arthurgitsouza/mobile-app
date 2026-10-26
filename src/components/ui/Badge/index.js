import React from 'react';
import { Text, View } from 'react-native';
import { colors, criticidadeMeta, statusMeta } from '../../../theme';
import Icon from '../Icon';
import { styles, dinamico } from './styles';

// Pílula de estado: cor + ícone + rótulo (a cor nunca carrega o significado sozinha).
export function Badge({ label, color = colors.gray, bg = colors.grayBg, icon, size = 'md', style }) {
  const small = size === 'sm';
  return (
    <View
      style={[styles.badge, dinamico.fundo(bg), small && styles.small, style]}
      accessible
      accessibilityLabel={label}
    >
      {icon ? <Icon name={icon} size={small ? 12 : 14} color={color} /> : null}
      <Text style={[styles.text, dinamico.cor(color), small && styles.textSmall]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function StatusBadge({ status, size = 'md', style, label }) {
  const m = statusMeta[status] || statusMeta.rascunho;
  return <Badge label={label || m.label} color={m.color} bg={m.bg} icon={m.icon} size={size} style={style} />;
}

export function CriticidadeBadge({ nivel, size = 'md', style }) {
  const m = criticidadeMeta[nivel] || criticidadeMeta.media;
  const icon =
    {
      baixa: 'arrow-down-circle-outline',
      media: 'minus-circle-outline',
      alta: 'arrow-up-circle-outline',
      critica: 'alert-octagon-outline',
    }[nivel] || 'minus-circle-outline';
  return <Badge label={m.label} color={m.color} bg={m.bg} icon={icon} size={size} style={style} />;
}

export default Badge;
