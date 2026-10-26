import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(8,20,36,0.96)' },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  nav: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 10 },
});
