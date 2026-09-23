import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { shadows } from '../../theme/shadows';
import Txt from './Txt';

// Bloco numerado do RDO (grupos A–M da seção 7), como no exemplo visual do documento-base.
export default function SectionCard({ letra, titulo, subtitulo, right, children, tone = 'default', style, bodyStyle }) {
  const gold = tone === 'gold';
  return (
    <View style={[styles.card, gold && styles.gold, !gold && shadows.card, style]}>
      <View style={styles.header}>
        {letra ? (
          <View style={[styles.letter, gold && { backgroundColor: colors.gold600 }]}>
            <Txt v="smallStrong" color={colors.white} style={styles.letterText}>
              {letra}
            </Txt>
          </View>
        ) : null}
        <View style={styles.titles}>
          <Txt v="label" color={gold ? colors.goldText : colors.navy600} numberOfLines={2} accessibilityRole="header">
            {String(titulo).toUpperCase()}
          </Txt>
          {subtitulo ? (
            <Txt v="caption" muted numberOfLines={2}>
              {subtitulo}
            </Txt>
          ) : null}
        </View>
        {right}
      </View>
      {children ? <View style={[styles.body, bodyStyle]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  gold: { backgroundColor: colors.gold50, borderColor: colors.gold500 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  letter: {
    minWidth: 30, height: 30, paddingHorizontal: 6, borderRadius: 8, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center',
  },
  letterText: { fontWeight: '800' },
  titles: { flex: 1, gap: 2 },
  body: { marginTop: 12, gap: 10 },
});
