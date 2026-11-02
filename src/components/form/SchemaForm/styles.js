import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});

// Valores que só se sabem em tempo de execução ficam em funções.
export const dinamico = {
  coluna: (gap) => ({ gap }),
};
