import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { chart, colors } from '../../theme';
import { Card, SegmentedTabs, Txt } from '../ui';

// Legenda: obrigatória com 2+ séries. Amostra colorida + rótulo em tinta (texto nunca usa a cor da série).
export function Legenda({ itens }) {
  return (
    <View style={styles.legenda} accessibilityRole="list">
      {itens.map((i) => (
        <View key={i.label} style={styles.leg} accessible accessibilityLabel={`Legenda: ${i.label}`}>
          <View style={[styles.swatch, { backgroundColor: i.cor }]} />
          <Txt v="caption" muted>
            {i.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

// Visão em tabela do mesmo dado (acessibilidade e leitura exata dos valores).
export function TabelaDados({ colunas, linhas }) {
  return (
    <View>
      <View style={[styles.tr, { borderBottomColor: chart.axis }]}>
        {colunas.map((c, i) => (
          <Txt key={c} v="caption" muted style={[i === 0 ? { flex: 1 } : styles.num, { fontWeight: '800' }]}>
            {c}
          </Txt>
        ))}
      </View>
      {linhas.map((l, ri) => (
        <View key={ri} style={styles.tr}>
          {l.map((c, i) => (
            <Txt key={i} v="small" style={i === 0 ? { flex: 1 } : styles.num} numberOfLines={2}>
              {c}
            </Txt>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Cartão de gráfico: título (o que está plotado), subtítulo, legenda e alternância Gráfico/Tabela.
 * tabela: { colunas: [...], linhas: [[...], ...] }
 */
export default function ChartCard({ titulo, subtitulo, legenda, tabela, children, style }) {
  const [modo, setModo] = useState('grafico');
  return (
    <Card style={[{ gap: 12 }, style]}>
      <View style={{ gap: 2 }}>
        <Txt v="h3" accessibilityRole="header">
          {titulo}
        </Txt>
        {subtitulo ? (
          <Txt v="small" muted>
            {subtitulo}
          </Txt>
        ) : null}
      </View>
      {tabela ? <SegmentedTabs compact items={[{ key: 'grafico', label: 'Gráfico', icon: 'chart-bar' }, { key: 'tabela', label: 'Tabela', icon: 'table' }]} value={modo} onChange={setModo} /> : null}
      {legenda && legenda.length > 1 && modo === 'grafico' ? <Legenda itens={legenda} /> : null}
      {modo === 'grafico' || !tabela ? children : <TabelaDados colunas={tabela.colunas} linhas={tabela.linhas} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.divider },
  num: { width: 76, textAlign: 'right' },
});
