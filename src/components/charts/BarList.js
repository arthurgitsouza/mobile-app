import React from 'react';
import { StyleSheet, View } from 'react-native';
import { chart, colors } from '../../theme';
import { Icon, Txt } from '../ui';

/**
 * Barras horizontais (comparar magnitude): uma única cor de série para categorias nominais, base reta e
 * ponta arredondada (4 px), até 20 px de espessura. `segmentos` gera barra empilhada com vão de 2 px.
 * dados: [{ label, valor, icone?, segmentos?: [{ valor, cor }] , texto? }]
 */
export default function BarList({ dados, cor = chart.series[0], formatar = (v) => String(v), rotuloLargura = 112, espessura = 18, max }) {
  const topo = max ?? Math.max(1, ...dados.map((d) => (d.segmentos ? d.segmentos.reduce((s, x) => s + x.valor, 0) : d.valor)));
  return (
    <View style={{ gap: 12 }}>
      {dados.map((d) => {
        const total = d.segmentos ? d.segmentos.reduce((s, x) => s + x.valor, 0) : d.valor;
        return (
          <View key={d.label} style={styles.linha} accessible accessibilityLabel={`${d.label}: ${d.texto || formatar(total)}`}>
            <View style={{ width: rotuloLargura, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {d.icone ? <Icon name={d.icone} size={16} color={colors.textMuted} /> : null}
              <Txt v="small" numberOfLines={2} style={{ flex: 1 }}>
                {d.label}
              </Txt>
            </View>
            <View style={{ flex: 1, height: espessura, justifyContent: 'center' }}>
              {d.segmentos ? (
                <View style={{ flexDirection: 'row', width: `${(total / topo) * 100}%`, minWidth: total > 0 ? 4 : 0 }}>
                  {d.segmentos
                    .filter((s) => s.valor > 0)
                    .map((s, i, arr) => (
                      <View
                        key={i}
                        style={{
                          flex: s.valor, height: espessura, backgroundColor: s.cor, marginRight: i < arr.length - 1 ? 2 : 0,
                          borderTopRightRadius: i === arr.length - 1 ? 4 : 0, borderBottomRightRadius: i === arr.length - 1 ? 4 : 0,
                        }}
                      />
                    ))}
                </View>
              ) : (
                <View style={{ width: `${(d.valor / topo) * 100}%`, minWidth: d.valor > 0 ? 4 : 0, height: espessura, backgroundColor: cor, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
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

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valor: { width: 78, textAlign: 'right' },
});
