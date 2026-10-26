import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const inputStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  focused: { borderColor: colors.navy600, backgroundColor: colors.white },
  error: { borderColor: colors.danger },
  readonly: { backgroundColor: colors.grayBg, borderColor: colors.border },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12, minWidth: 0 },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
});

export const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  searchLight: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderStrong },
  searchDark: { backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
});
