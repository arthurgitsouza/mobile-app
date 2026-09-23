import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { chart, colors } from '../../theme';
import { Txt } from '../ui';

const bonito = (max) => {
  if (max <= 0) return 10;
  const mag = 10 ** Math.floor(Math.log10(max));
  const n = max / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
};

// Pilha de uma coluna: do topo para a base, com vão de 2 px e só o segmento do topo arredondado.
function Pilha({ valores, series, max, altura }) {
  const partes = valores.map((v, si) => ({ v, si })).filter((p) => p.v > 0).reverse();
  const nos = [];
  partes.forEach((p, idx) => {
    if (idx > 0) nos.push(<View key={`gap${p.si}`} style={{ height: 2 }} />);
    nos.push(
      <View
        key={p.si}
        style={{
          height: Math.max(2, (p.v / max) * (altura - 1)), backgroundColor: series[p.si].cor,
          ...(idx === 0 ? { borderTopLeftRadius: 4, borderTopRightRadius: 4 } : null),
        }}
      />,
    );
  });
  return <>{nos}</>;
}

/**
 * Colunas verticais (tendência por dia). Empilha séries com vão de 2 px; coluna ≤ 24 px, topo arredondado (4 px).
 * dados: [{ chave, rotulo, rotulo2, valores: [v1, v2…], descricao }] · series: [{ nome, cor }]
 * Toque numa coluna para ver os valores exatos; só o extremo (máximo) recebe rótulo fixo.
 */
export default function ColumnChart({ dados, series, altura = 150, formatar = (v) => String(Math.round(v)), unidade = '' }) {
  const [sel, setSel] = useState(null);
  const totais = dados.map((d) => d.valores.reduce((a, b) => a + b, 0));
  const maxTotal = Math.max(0, ...totais);
  const max = bonito(maxTotal);
  const iMax = totais.indexOf(maxTotal);
  const ticks = [max, max / 2, 0];
  const atual = sel != null ? dados[sel] : null;

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.readout} accessibilityLiveRegion="polite">
        <Txt v="smallStrong" numberOfLines={2}>
          {atual ? `${atual.descricao} · ${formatar(totais[sel])} ${unidade}` : `Toque numa coluna para ver o detalhe (máx.: ${formatar(maxTotal)} ${unidade})`}
        </Txt>
        {atual && series.length > 1 ? (
          <Txt v="caption" muted numberOfLines={2}>
            {series.map((s, i) => `${s.nome} ${formatar(atual.valores[i])}`).join(' · ')}
          </Txt>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', height: altura + 30 }}>
        <View style={{ width: 40, height: altura, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
          {ticks.map((t, i) => (
            <Txt key={i} v="caption" muted style={{ fontSize: 10 }}>
              {formatar(t)}
            </Txt>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ height: altura }}>
            {[0, 0.5, 1].map((p) => (
              <View key={p} style={[styles.grade, { top: p * (altura - 1), backgroundColor: p === 1 ? chart.axis : chart.grid }]} />
            ))}
            <View style={styles.colunas}>
              {dados.map((d, i) => (
                <Pressable key={d.chave} onPress={() => setSel(sel === i ? null : i)} accessibilityRole="button" accessibilityLabel={`${d.descricao}: ${formatar(totais[i])} ${unidade}`} style={styles.slot}>
                  {i === iMax && totais[i] > 0 ? (
                    <Txt v="caption" style={styles.topo} numberOfLines={1}>
                      {formatar(totais[i])}
                    </Txt>
                  ) : null}
                  <View style={[styles.pilha, { opacity: sel === null || sel === i ? 1 : 0.35 }]}>
                    <Pilha valores={d.valores} series={series} max={max} altura={altura} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', height: 30 }}>
            {dados.map((d, i) => (
              <View key={d.chave} style={styles.eixoX}>
                <Txt v="caption" muted style={[styles.rot, sel === i && { color: colors.text, fontWeight: '800' }]}>
                  {d.rotulo}
                </Txt>
                <Txt v="caption" muted style={[styles.rot, sel === i && { color: colors.text, fontWeight: '800' }]}>
                  {d.rotulo2}
                </Txt>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 40, gap: 1 },
  grade: { position: 'absolute', left: 0, right: 0, height: 1 },
  colunas: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end' },
  slot: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  pilha: { width: '62%', maxWidth: 24, justifyContent: 'flex-end' },
  topo: { fontSize: 10, fontWeight: '800', color: colors.text, marginBottom: 2 },
  eixoX: { flex: 1, alignItems: 'center', paddingTop: 4 },
  rot: { fontSize: 9.5, lineHeight: 12 },
});
