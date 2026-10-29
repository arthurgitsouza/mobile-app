import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';
import { shadows } from '../../../theme/shadows';

export const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginTop: 8,
    marginBottom: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingBottom: 4 },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 14 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
