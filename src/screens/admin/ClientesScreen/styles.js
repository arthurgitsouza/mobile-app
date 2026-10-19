import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  cardGap: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
  },
  btnSave: {
    flex: 1.3,
  },
});
