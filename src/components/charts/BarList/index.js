import { styles, dinamico } from './styles';
import React from 'react';
import { View } from 'react-native';
import { chart, colors } from '../../../theme';
import { Icon, Txt } from '../../ui';

/**
 * Barras horizontais (comparar magnitude): uma única cor de série para categorias nominais, base reta e
 * ponta arredondada (4 px), até 20 px de espessura. `segmentos` gera barra empilhada com vão de 2 px.
 * dados: [{ label, valor, icone?, segmentos?: [{ valor, cor }] , texto? }]
 */
export default function BarList({
  dados,
  cor = chart.series[0],
  formatar = (v) => String(v),
  rotuloLargura = 112,
  espessura = 18,
  max,
}) {
  const topo =
    max ?? Math.max(1, ...dados.map((d) => (d.segmentos ? d.segmentos.reduce((s, x) => s + x.valor, 0) : d.valor)));
  return (
    <View style={styles.lista}>
      {dados.map((d) => {
        const total = d.segmentos ? d.segmentos.reduce((s, x) => s + x.valor, 0) : d.valor;
        return (
          <View
            key={d.label}
            style={styles.linha}
            accessible
            accessibilityLabel={`${d.label}: ${d.texto || formatar(total)}`}
          >
            <View style={dinamico.rotulo(rotuloLargura)}>
              {d.icone ? <Icon name={d.icone} size={16} color={colors.textMuted} /> : null}
              <Txt v="small" numberOfLines={2} style={styles.ocupa}>
                {d.label}
              </Txt>
            </View>
            <View style={dinamico.trilha(espessura)}>
              {d.segmentos ? (
                <View style={dinamico.pilha((total / topo) * 100, total > 0 ? 4 : 0)}>
                  {d.segmentos
                    .filter((s) => s.valor > 0)
                    .map((s, i, arr) => (
                      <View
                        key={i}
                        style={dinamico.segmento(s.valor, espessura, s.cor, i < arr.length - 1, i === arr.length - 1)}
                      />
                    ))}
                </View>
              ) : (
                <View style={dinamico.barra((d.valor / topo) * 100, d.valor > 0 ? 4 : 0, espessura, cor)} />
              )}
            </View>
            <Txt v="smallStrong" style={styles.valor} numberOfLines={1}>
              {d.texto || formatar(total)}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}
