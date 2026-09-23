import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors, radius } from '../../theme';
import { tracoParaPath } from '../../utils/svg';
import { Icon, Txt } from '../ui';

// Visualização de uma assinatura desenhada: dados = { tracos, largura, altura }.
export function SignatureView({ dados, height = 80, color = colors.navy800, style }) {
  if (!dados?.tracos?.length) return null;
  return (
    <View style={[{ height, width: '100%' }, style]} accessibilityLabel="Assinatura desenhada (representação visual)" accessible>
      <Svg width="100%" height="100%" viewBox={`0 0 ${dados.largura || 300} ${dados.altura || 120}`} preserveAspectRatio="xMidYMid meet">
        {dados.tracos.map((t, i) =>
          t.length === 1 ? (
            <Circle key={i} cx={t[0].x} cy={t[0].y} r={1.6} fill={color} />
          ) : (
            <Path key={i} d={tracoParaPath(t)} stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ),
        )}
      </Svg>
    </View>
  );
}

/**
 * Campo de assinatura desenhada com o dedo. É apenas a representação visual: a validade do ato vem da
 * sessão autenticada, do 2º fator e das evidências (seção 11). `onDrawingChange` permite bloquear a rolagem.
 */
export default function SignaturePad({ value, onChange, height = 190, onDrawingChange, disabled }) {
  const [tracos, setTracos] = useState(value?.tracos || []);
  const [atual, setAtual] = useState(null);
  const [dim, setDim] = useState({ w: 0, h: height });
  const atualRef = useRef(null);
  const tracosRef = useRef(tracos);
  const dimRef = useRef(dim);
  dimRef.current = dim;

  const ponto = (e) => {
    const { w, h } = dimRef.current;
    const x = Math.max(0, Math.min(w, e.nativeEvent.locationX));
    const y = Math.max(0, Math.min(h, e.nativeEvent.locationY));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const emitir = (lista) => {
    tracosRef.current = lista;
    setTracos(lista);
    onChange?.(lista.length ? { tracos: lista, largura: Math.round(dimRef.current.w), altura: Math.round(dimRef.current.h) } : null);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (e) => {
          onDrawingChange?.(true);
          const p = ponto(e);
          atualRef.current = [p];
          setAtual([p]);
        },
        onPanResponderMove: (e) => {
          const cur = atualRef.current;
          if (!cur) return;
          const p = ponto(e);
          const ult = cur[cur.length - 1];
          if (Math.hypot(p.x - ult.x, p.y - ult.y) < 1.5) return;
          atualRef.current = [...cur, p];
          setAtual(atualRef.current);
        },
        onPanResponderRelease: () => fim(),
        onPanResponderTerminate: () => fim(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled],
  );

  function fim() {
    const t = atualRef.current;
    atualRef.current = null;
    setAtual(null);
    onDrawingChange?.(false);
    if (t && t.length) emitir([...tracosRef.current, t]);
  }

  const limpar = () => emitir([]);
  const desfazer = () => emitir(tracosRef.current.slice(0, -1));
  const vazio = tracos.length === 0 && !atual;
  const todos = atual ? [...tracos, atual] : tracos;

  return (
    <View style={{ gap: 8 }}>
      <View
        style={[styles.pad, { height }, disabled && { opacity: 0.5 }]}
        onLayout={(e) => setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        {...pan.panHandlers}
        accessible
        accessibilityLabel="Área de assinatura. Desenhe sua assinatura com o dedo."
        accessibilityHint="Use dois dedos para rolar a tela; um dedo desenha."
      >
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          <Svg width="100%" height="100%">
            <Line x1={16} y1={height * 0.74} x2={Math.max(dim.w - 16, 16)} y2={height * 0.74} stroke={colors.borderStrong} strokeWidth={1.5} strokeDasharray="4 4" />
            {todos.map((t, i) =>
              t.length === 1 ? (
                <Circle key={i} cx={t[0].x} cy={t[0].y} r={1.6} fill={colors.navy800} />
              ) : (
                <Path key={i} d={tracoParaPath(t)} stroke={colors.navy800} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ),
            )}
          </Svg>
        </View>
        {vazio ? (
          <View style={[StyleSheet.absoluteFill, styles.hint, { pointerEvents: 'none' }]}>
            <Icon name="draw-pen" size={26} color={colors.textSubtle} />
            <Txt v="small" subtle>
              Assine aqui com o dedo
            </Txt>
          </View>
        ) : null}
        <View style={[styles.x, { pointerEvents: 'none' }]}>
          <Txt v="smallStrong" subtle>
            ✕
          </Txt>
        </View>
      </View>
      <View style={styles.actions}>
        <Txt v="caption" muted style={{ flex: 1 }}>
          {vazio ? 'Nenhum traço' : `${tracos.length} ${tracos.length === 1 ? 'traço' : 'traços'}`}
        </Txt>
        <ActionLink icon="undo" label="Desfazer" onPress={desfazer} disabled={vazio} />
        <ActionLink icon="eraser" label="Limpar" onPress={limpar} disabled={vazio} />
      </View>
    </View>
  );
}

function ActionLink({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={[styles.link, disabled && { opacity: 0.35 }]}
    >
      <Icon name={icon} size={18} color={colors.navy600} />
      <Txt v="smallStrong" color={colors.navy600}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: '#FBFCFE', overflow: 'hidden' },
  hint: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  x: { position: 'absolute', left: 12, bottom: 34 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 4 },
});
