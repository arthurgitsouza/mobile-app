import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.blue50,
  },
  fill: { flex: 1 },
  cartaoFase: { gap: 6 },
  acoes: { flexDirection: 'row', gap: 10 },
  botaoSalvar: { flex: 1.5 },
});
