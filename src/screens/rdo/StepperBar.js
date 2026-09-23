import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { PASSOS_RDO } from '../../constants';
import { Icon, ProgressBar, Txt } from '../../components/ui';

// Estado visual de cada etapa: atual, completa, com pendência obrigatória, com aviso ou ainda vazia.
const ESTILO = {
  completo: { bg: colors.success, fg: colors.white, icon: 'check' },
  atencao: { bg: colors.warning, fg: colors.white, icon: 'alert-outline' },
  erro: { bg: colors.danger, fg: colors.white, icon: 'exclamation-thick' },
  vazio: { bg: 'rgba(255,255,255,0.16)', fg: colors.white, icon: null },
};

export default function StepperBar({ passos = PASSOS_RDO, indice, porPasso, visitados, onSelecionar, progresso }) {
  const ref = useRef(null);
  const posicoes = useRef({});

  useEffect(() => {
    const x = posicoes.current[indice];
    if (x != null) ref.current?.scrollTo({ x: Math.max(0, x - 90), animated: true });
  }, [indice]);

  return (
    <View style={{ gap: 8, marginTop: 6 }}>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {passos.map((p, i) => {
          const atual = i === indice;
          const info = porPasso?.[p.key];
          // Pendências obrigatórias só "acendem" depois que a etapa foi visitada (evita ruído em telas ainda não vistas).
          const estado = info ? (info.estado === 'erro' && !visitados.has(p.key) ? 'vazio' : info.estado) : 'vazio';
          const s = ESTILO[estado];
          return (
            <Pressable
              key={p.key}
              onPress={() => onSelecionar(i)}
              onLayout={(e) => {
                posicoes.current[i] = e.nativeEvent.layout.x;
              }}
              accessibilityRole="button"
              accessibilityLabel={`Etapa ${i + 1}, ${p.titulo}${atual ? ', atual' : ''}${estado === 'completo' ? ', completa' : estado === 'erro' ? ', com pendências' : ''}`}
              accessibilityState={{ selected: atual }}
              style={styles.item}
            >
              <View style={[styles.dot, { backgroundColor: atual ? colors.gold500 : s.bg }, atual && { borderColor: colors.gold200 }]}>
                {atual ? (
                  <Icon name={p.icone} size={20} color={colors.navy900} />
                ) : s.icon ? (
                  <Icon name={s.icon} size={estado === 'erro' ? 18 : 20} color={s.fg} />
                ) : (
                  <Icon name={p.icone} size={19} color="rgba(255,255,255,0.85)" />
                )}
              </View>
              <Txt v="caption" color={atual ? colors.white : colors.textOnDarkMuted} style={[styles.label, atual && { fontWeight: '800' }]} numberOfLines={1}>
                {p.curto}
              </Txt>
              <Txt v="caption" color={colors.gold200} style={styles.letra}>
                {p.letras}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      {progresso ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={(progresso.completos / progresso.total) * 100} color={colors.gold500} track="rgba(255,255,255,0.2)" height={6} label="Etapas completas" />
          </View>
          <Txt v="caption" color={colors.textOnDarkMuted}>
            {progresso.completos}/{progresso.total} etapas
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, paddingRight: 8 },
  item: { width: 66, alignItems: 'center', gap: 2, paddingVertical: 2 },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  label: { fontSize: 11, textAlign: 'center' },
  letra: { fontSize: 10, letterSpacing: 0.5, opacity: 0.85 },
});
