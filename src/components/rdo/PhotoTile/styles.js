import { StyleSheet } from 'react-native';
import { radius } from '../../../theme';

export const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 4 },
  num: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(12,32,56,0.78)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badges: { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', gap: 4 },
  mini: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
