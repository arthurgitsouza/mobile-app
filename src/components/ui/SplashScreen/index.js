import { styles, ICONE_ALTURA, BRILHO, TRILHO, SEGMENTO, AZUL_MARCA } from './styles';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../../theme';
import Txt from '.././Txt';

// Splash de abertura: o contorno do prédio da Planengen (o mesmo do assets/icon.png) se desenha,
// aparecem o nome da empresa e "Consultoria e Construção LTDA", e um filete dourado indica o carregamento.
// Fica na tela até a animação de entrada terminar E o app ficar `pronto`; aí some e chama `onFim`.

// Contorno do prédio nas coordenadas do assets/icon.png (1024 x 1024).
const LINHAS = [
  [
    [478, 792],
    [478, 240],
    [665, 377],
    [665, 580],
    [572, 625],
    [572, 792],
  ],
  [
    [356, 792],
    [356, 388],
    [476, 290],
  ],
  [
    [665, 792],
    [665, 636],
  ],
];
const VIEWBOX = { x: 340, y: 225, w: 345, h: 582 };
const ICONE_LARGURA = (ICONE_ALTURA * VIEWBOX.w) / VIEWBOX.h;
const TRACO = 10;

const comprimento = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const caminho = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
const CONTORNOS = LINHAS.map((pts) => ({ d: caminho(pts), len: Math.ceil(comprimento(pts)) }));

// Linha do tempo (ms). O traço anima a propriedade do SVG (driver JS); o resto usa o driver nativo.
const DURACAO_TRACO = 1600;
const INICIO_TRACO = [300, 500, 750];
const TEMPO_TRACO = 800;
const DURACAO = 2600;
const SAIDA = 450;

const nativo = Platform.OS !== 'web';
const suave = Easing.inOut(Easing.cubic);
const saidaSuave = Easing.out(Easing.cubic);

const AnimatedPath = Animated.createAnimatedComponent(Path);

function faixa(valor, de, ate, total, saida = [0, 1], easing = suave) {
  return valor.interpolate({
    inputRange: [de / total, ate / total],
    outputRange: saida,
    easing,
    extrapolate: 'clamp',
  });
}

function Contorno({ cor, traco, animado }) {
  return (
    <Svg
      width={ICONE_LARGURA}
      height={ICONE_ALTURA}
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      fill="none"
    >
      {CONTORNOS.map(({ d, len }, i) =>
        animado ? (
          <AnimatedPath
            key={d}
            d={d}
            stroke={cor}
            strokeWidth={TRACO}
            strokeDasharray={`${len} ${len}`}
            strokeDashoffset={faixa(traco, INICIO_TRACO[i], INICIO_TRACO[i] + TEMPO_TRACO, DURACAO_TRACO, [len, 0])}
          />
        ) : (
          <Path key={d} d={d} stroke={cor} strokeWidth={TRACO} />
        ),
      )}
    </Svg>
  );
}

export default function SplashScreen({ pronto = false, onFim }) {
  const [traco] = useState(() => new Animated.Value(0));
  const [t] = useState(() => new Animated.Value(0));
  const [barra] = useState(() => new Animated.Value(0));
  const [visivel] = useState(() => new Animated.Value(1));
  const [entradaFeita, setEntradaFeita] = useState(false);

  useEffect(() => {
    let ativo = true;
    let loop;
    const iniciarBarra = () => {
      loop = Animated.loop(
        Animated.timing(barra, { toValue: 1, duration: 1100, easing: suave, useNativeDriver: nativo }),
      );
      loop.start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduzir) => {
        if (!ativo) return;
        if (reduzir) {
          // Movimento reduzido: mostra a marca pronta, sem desenhar nem deslocar.
          traco.setValue(1);
          t.setValue(1);
          setEntradaFeita(true);
          return;
        }
        Animated.parallel([
          Animated.timing(traco, {
            toValue: 1,
            duration: DURACAO_TRACO,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(t, { toValue: 1, duration: DURACAO, easing: Easing.linear, useNativeDriver: nativo }),
        ]).start(({ finished }) => {
          if (finished && ativo) setEntradaFeita(true);
        });
        setTimeout(() => ativo && iniciarBarra(), 2300);
      });

    return () => {
      ativo = false;
      loop?.stop();
    };
  }, [traco, t, barra]);

  useEffect(() => {
    if (!entradaFeita || !pronto) return;
    Animated.timing(visivel, {
      toValue: 0,
      duration: SAIDA,
      easing: saidaSuave,
      useNativeDriver: nativo,
    }).start(() => onFim?.());
  }, [entradaFeita, pronto, visivel, onFim]);

  const sobe = faixa(t, 1500, 2100, DURACAO);
  const marca = {
    transform: [
      { translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) },
      { scale: sobe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) },
    ],
  };
  const brilho = { opacity: faixa(t, 1200, 2000, DURACAO) };
  const branco = { opacity: faixa(t, 1500, 1900, DURACAO) };
  const titulo1 = faixa(t, 1800, 2400, DURACAO, [0, 1], saidaSuave);
  const subtitulo1 = faixa(t, 2050, 2600, DURACAO, [0, 1], saidaSuave);
  const textos = { transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) }] };
  const tituloAnim = {
    opacity: titulo1,
    transform: [{ translateY: titulo1.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };
  const subtituloAnim = {
    opacity: subtitulo1,
    transform: [{ translateY: subtitulo1.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
  const saida = { opacity: visivel };
  const trilho = { opacity: faixa(t, 2300, 2600, DURACAO) };
  const segmento = {
    transform: [{ translateX: barra.interpolate({ inputRange: [0, 1], outputRange: [-SEGMENTO, TRILHO] }) }],
  };

  return (
    <Animated.View
      style={[styles.root, saida]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Abrindo o app da Planengen"
    >
      <StatusBar style="light" />
      <View style={styles.centro}>
        <Animated.View style={[styles.marca, marca]}>
          <Animated.View style={[styles.brilho, brilho]} pointerEvents="none">
            <Svg width={BRILHO} height={BRILHO}>
              <Defs>
                <RadialGradient id="brilhoSplash" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={AZUL_MARCA} stopOpacity="0.35" />
                  <Stop offset="1" stopColor={AZUL_MARCA} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={BRILHO / 2} cy={BRILHO / 2} r={BRILHO / 2} fill="url(#brilhoSplash)" />
            </Svg>
          </Animated.View>
          <Contorno cor={AZUL_MARCA} traco={traco} animado />
          <Animated.View style={[styles.camada, branco]}>
            <Contorno cor={colors.white} />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.textos, textos]}>
          <Animated.View style={tituloAnim}>
            <Txt v="display" style={styles.titulo}>
              Planengen
            </Txt>
          </Animated.View>
          <Animated.View style={subtituloAnim}>
            <Txt v="label" style={styles.subtitulo}>
              CONSULTORIA E CONSTRUÇÃO LTDA
            </Txt>
          </Animated.View>
          <Animated.View style={[styles.trilho, trilho]}>
            <Animated.View style={[styles.segmento, segmento]} />
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
