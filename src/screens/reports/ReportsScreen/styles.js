import { StyleSheet } from 'react-native';
import { chart } from '../../../theme';

export const COR_STATUS_CRIT = {
  baixa: chart.status.good,
  media: chart.status.warning,
  alta: chart.status.serious,
  critica: chart.status.critical,
};

export const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gap10: { gap: 10 },
  gap8PaddingRight16: { gap: 8, paddingRight: 16 },
  flexGrow0: { flexGrow: 0 },
  gap8: { gap: 8 },
  flex1: { flex: 1 },
  width96: { width: 96 },
  flex1Height16: { flex: 1, height: 16, justifyContent: 'center' },
  width28TextAlignRight: { width: 28, textAlign: 'right' },
  flex1Gap2: { flex: 1, gap: 2 },
});

// Valores que dependem de props, estado ou do aparelho viram funções aqui mesmo.
export const dinamico = {
  barraNivel: (p, max) => ({
    width: `${(p.n / max) * 100}%`,
    minWidth: p.n ? 4 : 0,
    height: 16,
    backgroundColor: COR_STATUS_CRIT[p.nivel],
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  }),
};
