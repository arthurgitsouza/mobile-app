import React from 'react';
import { Platform, Text } from 'react-native';
import { colors, type } from '../../theme';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// Texto tipado: <Txt v="h2" muted>…</Txt>. Cor padrão = tinta principal; `muted` usa a secundária; `mono` p/ hashes.
export default function Txt({ v = 'body', muted, subtle, color, mono, style, children, ...rest }) {
  const tint = color || (subtle ? colors.textSubtle : muted ? colors.textMuted : colors.text);
  return (
    <Text {...rest} style={[type[v], { color: tint }, mono && { fontFamily: MONO }, style]}>
      {children}
    </Text>
  );
}
