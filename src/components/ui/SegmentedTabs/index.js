import { styles } from './styles';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme';
import { shadows } from '../../../theme/shadows';
import Icon from '.././Icon';

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
