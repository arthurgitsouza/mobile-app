import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  linha10: { flexDirection: 'row', gap: 10 },
  linha12: { flexDirection: 'row', gap: 12 },
  fill: { flex: 1 },
  fillLargo: { flex: 1.6 },
  gap4: { gap: 4 },
  respiro: { paddingVertical: 2 },
});

export const dinamico = {
  opcao: (on) => ({ borderWidth: 0, backgroundColor: on ? colors.blue50 : colors.white }),
};
