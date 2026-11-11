import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme';

// Medidas da marca na splash (em dp). O ícone segue a proporção do contorno do prédio.
export const ICONE_ALTURA = 120;
export const BRILHO = 300;
export const TRILHO = 72;
export const SEGMENTO = 28;
// Azul oficial da Planengen (docs/design.md): só em traço e brilho, nunca sob texto.
export const AZUL_MARCA = '#0084F4';

export const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.navy900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: { alignItems: 'center' },
  marca: { alignItems: 'center', justifyContent: 'center' },
  brilho: { position: 'absolute', width: BRILHO, height: BRILHO },
  camada: { position: 'absolute' },
  textos: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  titulo: { color: colors.white },
  subtitulo: { color: colors.textOnDarkMuted, textAlign: 'center' },
  trilho: {
    width: TRILHO,
    height: 3,
    borderRadius: 2,
    marginTop: spacing.xxxl,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  segmento: { width: SEGMENTO, height: 3, borderRadius: 2, backgroundColor: colors.gold500 },
});
