import React from 'react';
import { View } from 'react-native';
import { styles } from './styles';
import { colors } from '../../../theme';
import { formatDateLong, horaAgoraObra, hojeObra, nomeDiaSemana } from '../../../utils/date';
import { capitalizar, primeiroNome } from '../../../utils/format';
import { Txt } from '../../../components/ui';

export function saudacao() {
  const h = Number(horaAgoraObra().slice(0, 2));
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function tituloBoasVindas(user) {
  return `${saudacao()}, ${primeiroNome(user.nome)}`;
}

export function DataDeHoje() {
  const hoje = hojeObra();
  return (
    <Txt v="small" muted>
      {capitalizar(nomeDiaSemana(hoje))}, {formatDateLong(hoje)}
    </Txt>
  );
}

// Grade 2 colunas para tiles de indicadores.
export function Grade({ children }) {
  const itens = React.Children.toArray(children).filter(Boolean);
  const linhas = [];
  for (let i = 0; i < itens.length; i += 2) linhas.push(itens.slice(i, i + 2));
  return (
    <View style={styles.gradeGap}>
      {linhas.map((l, i) => (
        <View key={i} style={styles.linha}>
          {l.map((c, j) => (
            <View key={j} style={styles.colunaFlex}>
              {c}
            </View>
          ))}
          {l.length === 1 ? <View style={styles.colunaFlex} /> : null}
        </View>
      ))}
    </View>
  );
}

export function TituloSecao({ children, acao, onAcao }) {
  return (
    <View style={styles.titulo}>
      <Txt v="h3" style={styles.colunaFlex} accessibilityRole="header">
        {children}
      </Txt>
      {acao ? (
        <Txt v="smallStrong" color={colors.blue500} onPress={onAcao} accessibilityRole="link" style={styles.acaoLink}>
          {acao}
        </Txt>
      ) : null}
    </View>
  );
}
