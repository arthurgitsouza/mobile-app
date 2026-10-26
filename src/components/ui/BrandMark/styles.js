import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.gold500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold200,
  },
});

export const dinamico = {
  marca: (size) => ({ width: size, height: size, borderRadius: size * 0.28 }),
};
