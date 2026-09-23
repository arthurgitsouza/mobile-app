import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, criticidadeMeta, radius, statusMeta } from '../../theme';
import Icon from './Icon';

// Pílula de estado: cor + ícone + rótulo (a cor nunca carrega o significado sozinha).
export function Badge({ label, color = colors.gray, bg = colors.grayBg, icon, size = 'md', style }) {
  const small = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: bg }, small && styles.small, style]} accessible accessibilityLabel={label}>
      {icon ? <Icon name={icon} size={small ? 12 : 14} color={color} /> : null}
      <Text style={[styles.text, { color }, small && { fontSize: 11 }]} numberOfLines={1}>
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
  const icon = { baixa: 'arrow-down-circle-outline', media: 'minus-circle-outline', alta: 'arrow-up-circle-outline', critica: 'alert-octagon-outline' }[nivel] || 'minus-circle-outline';
  return <Badge label={m.label} color={m.color} bg={m.bg} icon={icon} size={size} style={style} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
  },
  small: { paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  text: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
});

export default Badge;
