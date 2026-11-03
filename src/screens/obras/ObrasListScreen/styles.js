import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topo: { marginTop: 8 },
  cartao: { gap: 12 },
  fill: { flex: 1 },
  info: { gap: 4 },
  avatares: { flexDirection: 'row' },
});

export const dinamico = {
  avatar: (i) => ({ marginLeft: i ? -8 : 0, borderWidth: 2, borderColor: colors.white }),
};
