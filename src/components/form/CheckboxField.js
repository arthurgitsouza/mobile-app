import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { Icon, Txt } from '../ui';

// Caixa de seleção (aceites legais e declarações). Toda a linha é área de toque.
// plain: versão compacta, sem moldura (ex.: "Manter conectado").
export default function CheckboxField({ label, description, value, onValueChange, required, error, style, disabled, plain }) {
  return (
    <View style={style}>
      <Pressable
        onPress={() => !disabled && onValueChange?.(!value)}
        accessibilityRole="checkbox"
        accessibilityLabel={`${label}${required ? ', obrigatório' : ''}`}
        accessibilityState={{ checked: !!value, disabled: !!disabled }}
        style={[plain ? styles.plain : styles.row, !plain && value && styles.on, !!error && { borderColor: colors.danger }, disabled && { opacity: 0.5 }]}
      >
        <Icon name={value ? 'checkbox-marked' : 'checkbox-blank-outline'} size={plain ? 24 : 26} color={value ? colors.navy700 : colors.textMuted} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v={plain ? 'small' : 'bodyStrong'} style={plain ? { fontWeight: '600' } : undefined}>
            {label}
            {required ? <Txt v="bodyStrong" color={colors.danger}>{' *'}</Txt> : null}
          </Txt>
          {description ? (
            <Txt v="small" muted>
              {description}
            </Txt>
          ) : null}
        </View>
      </Pressable>
      {error ? (
        <Txt v="caption" color={colors.danger} style={{ marginTop: 4 }}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, minHeight: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  plain: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  on: { borderColor: colors.navy600, backgroundColor: colors.blue50 },
});
