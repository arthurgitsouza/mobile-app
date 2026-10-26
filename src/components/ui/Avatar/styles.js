import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

// Todas as cores mantêm ≥ 4,5:1 com o texto branco.
export const CORES = [colors.navy700, colors.teal, colors.purple, colors.info, colors.success, colors.warning];

export const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontWeight: '800' },
});

export const dinamico = {
  avatar: (size, cor) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: cor }),
  inicial: (size) => ({ fontSize: size * 0.38 }),
};
