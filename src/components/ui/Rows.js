import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import Icon from './Icon';
import Txt from './Txt';

// Linha de lista com ícone tonal, título, subtítulo e complemento à direita.
export function ListRow({ icon, iconColor = colors.navy600, iconBg = colors.blue100, title, subtitle, right, onPress, chevron = true, danger, style, disabled, badge }) {
  const content = (
    <View style={[styles.row, style]}>
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: danger ? colors.dangerBg : iconBg }]}>
          <Icon name={icon} size={22} color={danger ? colors.danger : iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="bodyStrong" color={danger ? colors.danger : colors.text} numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt v="small" muted numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {badge}
      {right}
      {onPress && chevron ? <Icon name="chevron-right" size={22} color={colors.textSubtle} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle].filter(Boolean).join('. ')}
      style={({ pressed }) => [pressed && { backgroundColor: colors.blue50 }, disabled && { opacity: 0.5 }]}
    >
      {content}
    </Pressable>
  );
}

export function Divider({ style, inset = 0 }) {
  return <View style={[{ height: 1, backgroundColor: colors.divider, marginLeft: inset }, style]} />;
}

// Rótulo + valor (leitura). `inline` coloca lado a lado.
export function KeyValue({ label, value, inline, style, valueStyle, muted, children }) {
  return (
    <View style={[inline ? styles.kvInline : styles.kv, style]}>
      <Txt v="caption" muted style={inline ? { flexBasis: '42%', flexShrink: 0 } : undefined}>
        {label}
      </Txt>
      {children || (
        <Txt v="body" muted={muted} style={[inline && { flex: 1, textAlign: 'right' }, valueStyle]}>
          {value === undefined || value === null || value === '' ? '—' : value}
        </Txt>
      )}
    </View>
  );
}

export function SectionTitle({ children, right, style }) {
  return (
    <View style={[styles.sectionTitle, style]}>
      <Txt v="label" color={colors.navy600} accessibilityRole="header" style={{ flex: 1 }}>
        {String(children).toUpperCase()}
      </Txt>
      {right}
    </View>
  );
}

export function LinkButton({ title, onPress, icon, color = colors.blue500, style }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={title} hitSlop={8} style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }, style]}>
      {icon ? <Icon name={icon} size={16} color={color} /> : null}
      <Txt v="smallStrong" color={color}>
        {title}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, minHeight: 56 },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  kv: { gap: 2 },
  kvInline: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 2, gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32, alignSelf: 'flex-start' },
});
