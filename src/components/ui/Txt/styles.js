import { Platform, StyleSheet } from 'react-native';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const styles = StyleSheet.create({
  mono: { fontFamily: MONO },
});

// Valores que dependem das props viram funções aqui mesmo.
export const dinamico = {
  cor: (tint) => ({ color: tint }),
};
