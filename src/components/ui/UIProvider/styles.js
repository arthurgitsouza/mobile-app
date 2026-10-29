import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';
import { shadows } from '../../../theme/shadows';

export const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 12, right: 12, zIndex: 1000 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  dialogRoot: { flex: 1, justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, gap: 12, alignItems: 'stretch' },
  dialogIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
  },
});
