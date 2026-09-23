import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import { iniciais } from '../../utils/format';

// Todas as cores mantêm ≥ 4,5:1 com o texto branco.
const CORES = [colors.navy700, colors.teal, colors.purple, colors.info, colors.success, colors.warning];

function corDe(nome = '') {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return CORES[h % CORES.length];
}

export default function Avatar({ nome, size = 40, style }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: corDe(nome) }, style]} accessible={false}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{iniciais(nome)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontWeight: '800' },
});
