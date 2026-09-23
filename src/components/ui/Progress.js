import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { chart, colors } from '../../theme';
import Txt from './Txt';

// Medidor: preenchimento na cor de acento sobre trilha de um tom mais claro da mesma rampa.
export function ProgressBar({ value = 0, color = chart.seq[450], track = chart.track, height = 8, style, label }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function ProgressRing({ value = 0, size = 64, stroke = 7, color = chart.seq[450], track = chart.track, children, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children || (
        <Txt v="smallStrong" color={colors.text}>
          {Math.round(pct)}%
        </Txt>
      )}
    </View>
  );
}
