import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pos: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default styles;