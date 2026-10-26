import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.navy700, paddingHorizontal: 12, paddingBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 4 },
  back: { marginLeft: -4 },
  titles: { flex: 1, paddingLeft: 4, paddingRight: 4, gap: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
  gold: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: colors.gold500 },
});
