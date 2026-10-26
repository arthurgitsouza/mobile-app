import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  readout: { minHeight: 40, gap: 1 },
  grade: { position: 'absolute', left: 0, right: 0, height: 1 },
  colunas: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end' },
  slot: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  pilha: { width: '62%', maxWidth: 24, justifyContent: 'flex-end' },
  topo: { fontSize: 10, fontWeight: '800', color: colors.text, marginBottom: 2 },
  eixoX: { flex: 1, alignItems: 'center', paddingTop: 4 },
  rot: { fontSize: 9.5, lineHeight: 12 },
});
