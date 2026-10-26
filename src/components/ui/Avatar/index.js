import React from 'react';
import { Text, View } from 'react-native';
import { iniciais } from '../../../utils/format';
import { styles, dinamico, CORES } from './styles';

function corDe(nome = '') {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return CORES[h % CORES.length];
}

export default function Avatar({ nome, size = 40, style }) {
  return (
    <View style={[styles.wrap, dinamico.avatar(size, corDe(nome)), style]} accessible={false}>
      <Text style={[styles.text, dinamico.inicial(size)]}>{iniciais(nome)}</Text>
    </View>
  );
}
