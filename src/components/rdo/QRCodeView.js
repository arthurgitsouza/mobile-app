import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../theme';
import { qrModules, qrSvgPath } from '../../utils/svg';

// QR code de verificação (seção 11): aponta para a página/link de verificação do hash do documento.
export default function QRCodeView({ value, size = 132, color = colors.navy900, bg = colors.white }) {
  const m = useMemo(() => qrModules(value), [value]);
  const d = useMemo(() => qrSvgPath(m), [m]);
  const margem = 2;
  const box = m.size + margem * 2;
  return (
    <View accessible accessibilityLabel="QR code de verificação do documento" style={{ width: size, height: size, backgroundColor: bg }}>
      <Svg width={size} height={size} viewBox={`${-margem} ${-margem} ${box} ${box}`}>
        <Rect x={-margem} y={-margem} width={box} height={box} fill={bg} />
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
}
