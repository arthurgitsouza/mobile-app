import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { chart, colors, radius } from '../../theme';
import { shadows } from '../../theme/shadows';
import { Icon, Txt } from '../ui';

// Mini-tendência (12 pontos): série em cinza de apoio; ponto atual no acento (skill dataviz — stat tile).
export function Sparkline({ data = [], width = 64, height = 22 }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 4;
  const pts = data.map((v, i) => [pad + (i * (width - pad * 2)) / (data.length - 1), height - pad - ((v - min) / span) * (height - pad * 2)]);
  const ult = pts[pts.length - 1];
  return (
    <Svg width={width} height={height} accessibilityElementsHidden>
      <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={chart.neutral} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={ult[0]} cy={ult[1]} r={4} fill={chart.seq[450]} stroke={colors.white} strokeWidth={2} />
    </Svg>
  );
}

/**
 * Tile de indicador: rótulo (frase), valor grande, delta opcional (sinal + período nomeado) e tendência.
 * delta: { valor: '+2', texto: 'vs. semana passada', bom: true|false|null }  — a cor = direção × se subir é bom.
 * destaque: contorno dourado quando há pendência que exige ação.
 */
export function StatTile({ label, value, unit, icon, delta, onPress, sparkline, destaque, style, hint }) {
  const conteudo = (
    <View style={[styles.tile, shadows.card, destaque && styles.destaque, style]}>
      <View style={styles.top}>
        {icon ? (
          <View style={styles.icon}>
            <Icon name={icon} size={18} color={colors.navy600} />
          </View>
        ) : null}
        <Txt v="small" muted style={{ flex: 1 }} numberOfLines={2}>
          {label}
        </Txt>
      </View>
      <View style={styles.valueRow}>
        <Txt v="display" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Txt>
        {unit ? (
          <Txt v="smallStrong" muted style={{ marginBottom: 4 }}>
            {unit}
          </Txt>
        ) : null}
        {sparkline ? (
          <View style={{ marginLeft: 'auto' }}>
            <Sparkline data={sparkline} />
          </View>
        ) : null}
      </View>
      {delta ? (
        <View style={styles.delta}>
          <Icon
            name={String(delta.valor).startsWith('-') ? 'arrow-down' : 'arrow-up'}
            size={14}
            color={delta.bom == null ? colors.textMuted : delta.bom ? chart.deltaGood : chart.deltaBad}
          />
          <Txt v="caption" color={delta.bom == null ? colors.textMuted : delta.bom ? chart.deltaGood : chart.deltaBad} style={{ fontWeight: '800' }}>
            {delta.valor}
          </Txt>
          <Txt v="caption" muted>
            {delta.texto}
          </Txt>
        </View>
      ) : hint ? (
        <Txt v="caption" muted numberOfLines={2}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
  if (!onPress) return conteudo;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`} style={({ pressed }) => pressed && { opacity: 0.88 }}>
      {conteudo}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6, minHeight: 112 },
  destaque: { borderColor: colors.gold500, borderWidth: 2 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  icon: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  value: { fontSize: 32, lineHeight: 38 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
});
