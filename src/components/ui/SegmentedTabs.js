import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';
import { shadows } from '../../theme/shadows';
import Icon from './Icon';

// Abas segmentadas (ex.: Conteúdo | Comentários | Histórico). `items`: [{ key, label, icon?, count? }]
export default function SegmentedTabs({ items, value, onChange, style, compact }) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            accessibilityRole="tab"
            accessibilityLabel={it.count != null ? `${it.label}, ${it.count}` : it.label}
            accessibilityState={{ selected: active }}
            style={[styles.tab, compact && { minHeight: 38 }, active && styles.active, active && shadows.card]}
          >
            {it.icon ? <Icon name={it.icon} size={16} color={active ? colors.navy700 : colors.textMuted} /> : null}
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
              {it.label}
            </Text>
            {it.count != null ? (
              <View style={[styles.count, active && { backgroundColor: colors.navy700 }]}>
                <Text style={[styles.countText, active && { color: colors.white }]}>{it.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.grayBg, borderRadius: radius.md, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 42, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingHorizontal: 6 },
  active: { backgroundColor: colors.white },
  text: { fontSize: 13.5, fontWeight: '700', color: colors.textMuted },
  textActive: { color: colors.navy700 },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, fontWeight: '800', color: colors.navy800 },
});
