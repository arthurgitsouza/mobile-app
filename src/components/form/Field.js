import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { Icon, Txt } from '../ui';

// Cada campo tem rótulo, indicação de obrigatoriedade (*), ajuda curta e erro em linha (seção 8 do documento-base).
export default function Field({ label, required, help, error, right, children, style }) {
  return (
    <View style={[styles.field, style]}>
      {label ? (
        <View style={styles.labelRow}>
          <Txt v="smallStrong" style={{ flex: 1 }}>
            {label}
            {required ? <Txt v="smallStrong" color={colors.danger}>{' *'}</Txt> : null}
          </Txt>
          {right}
        </View>
      ) : null}
      {help ? (
        <Txt v="caption" muted>
          {help}
        </Txt>
      ) : null}
      {children}
      {error ? (
        <View style={styles.errorRow} accessibilityRole="alert">
          <Icon name="alert-circle-outline" size={15} color={colors.danger} />
          <Txt v="caption" color={colors.danger} style={{ flex: 1 }}>
            {error}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
