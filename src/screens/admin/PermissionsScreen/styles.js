import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
  },
  col: {
    width: 64,
    alignItems: 'center',
    gap: 2,
  },
  colLabel: {
    fontSize: 10.5,
  },
  cardGrupo: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  grupoTitulo: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sep: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  legenda: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardObraGap: {
    gap: 10,
  },
  flexOne: {
    flex: 1,
  },
});
