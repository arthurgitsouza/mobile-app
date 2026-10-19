import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGap: {
    gap: 6,
  },
  searchMargin: {
    marginTop: 8,
  },
  flexOne: {
    flex: 1,
  },
});
