import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { colors } from '../../../theme';
import { PASSOS_RDO } from '../../../constants';
import { Icon, ProgressBar, Txt } from '../../../components/ui';
import { styles, dinamico, ESTILO } from './styles';

export default function StepperBar({ passos = PASSOS_RDO, indice, porPasso, visitados, onSelecionar, progresso }) {
  const ref = useRef(null);
  const posicoes = useRef({});

  useEffect(() => {
    const x = posicoes.current[indice];
    if (x != null) ref.current?.scrollTo({ x: Math.max(0, x - 90), animated: true });
  }, [indice]);

  return (
    <View style={styles.gap8MarginTop6}>
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
              <View style={[styles.dot, dinamico.fundoEtapa(atual, s), atual && styles.borderColorGold200]}>
                {atual ? (
                  <Icon name={p.icone} size={20} color={colors.navy900} />
                ) : s.icon ? (
                  <Icon name={s.icon} size={estado === 'erro' ? 18 : 20} color={s.fg} />
                ) : (
                  <Icon name={p.icone} size={19} color="rgba(255,255,255,0.85)" />
                )}
              </View>
              <Txt
                v="caption"
                color={atual ? colors.white : colors.textOnDarkMuted}
                style={[styles.label, atual && styles.fontWeight800]}
                numberOfLines={1}
              >
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
        <View style={styles.rowAlignItemsCenter}>
          <View style={styles.flex1}>
            <ProgressBar
              value={(progresso.completos / progresso.total) * 100}
              color={colors.gold500}
              track="rgba(255,255,255,0.2)"
              height={6}
              label="Etapas completas"
            />
          </View>
          <Txt v="caption" color={colors.textOnDarkMuted}>
            {progresso.completos}/{progresso.total} etapas
          </Txt>
        </View>
      ) : null}
    </View>
  );
}
