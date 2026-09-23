import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { chart, colors } from '../../theme';
import { Txt } from '../ui';

const bonito = (max) => {
  if (max <= 0) return 10;
  const mag = 10 ** Math.floor(Math.log10(max));
  const n = max / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
};

/**
 * Linha de evolução (uma série): 2 px com pontas redondas, área a 10% de opacidade, marcador final de 8 px com
 * anel de 2 px na cor da superfície. Rótulo só no ponto final; eixo com valores redondos.
 * pontos: [{ rotulo, valor }]
 */
export default function LineChart({ pontos, altura = 160, formatar = (v) => String(Math.round(v)), unidade = '', cor = chart.series[0] }) {
  const [largura, setLargura] = useState(0);
  if (!pontos.length) return null;
  const padE = 44;
  const padD = 10;
  const padT = 14;
  const padB = 22;
  const max = bonito(Math.max(...pontos.map((p) => p.valor)));
  const w = Math.max(0, largura - padE - padD);
  const h = altura - padT - padB;
  const x = (i) => padE + (pontos.length === 1 ? w / 2 : (i * w) / (pontos.length - 1));
  const y = (v) => padT + h - (v / max) * h;
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.valor)}`).join(' ');
  const area = `${linha} L ${x(pontos.length - 1)} ${padT + h} L ${x(0)} ${padT + h} Z`;
  const ultimo = pontos[pontos.length - 1];

  return (
    <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)} accessible accessibilityLabel={`Evolução: ${pontos.length} pontos, último valor ${formatar(ultimo.valor)} ${unidade}`}>
      {largura > 0 ? (
        <Svg width={largura} height={altura}>
          {[0, 0.5, 1].map((p) => (
            <Line key={p} x1={padE} x2={padE + w} y1={padT + h - p * h} y2={padT + h - p * h} stroke={p === 0 ? chart.axis : chart.grid} strokeWidth={1} />
          ))}
          <Path d={area} fill={cor} opacity={0.1} />
          <Path d={linha} stroke={cor} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={x(pontos.length - 1)} cy={y(ultimo.valor)} r={6} fill={colors.white} />
          <Circle cx={x(pontos.length - 1)} cy={y(ultimo.valor)} r={4} fill={cor} />
        </Svg>
      ) : null}
      {largura > 0 ? (
        <>
          {[max, max / 2, 0].map((t, i) => (
            <Txt key={i} v="caption" muted style={{ position: 'absolute', left: 0, width: padE - 6, textAlign: 'right', top: padT + h - (t / max) * h - 7, fontSize: 10 }}>
              {formatar(t)}
            </Txt>
          ))}
          <Txt v="caption" muted style={{ position: 'absolute', left: padE, top: altura - 16, fontSize: 10 }}>
            {pontos[0].rotulo}
          </Txt>
          <Txt v="caption" muted style={{ position: 'absolute', right: padD, top: altura - 16, fontSize: 10 }}>
            {ultimo.rotulo}
          </Txt>
          <Txt v="smallStrong" style={{ position: 'absolute', right: padD, top: Math.max(0, y(ultimo.valor) - 26) }}>
            {formatar(ultimo.valor)} {unidade}
          </Txt>
        </>
      ) : null}
    </View>
  );
}
