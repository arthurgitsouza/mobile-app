import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
  },
  btnSubmit: {
    flex: 2,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minHeight: 72,
  },
  opIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opTextContainer: {
    flex: 1,
    gap: 2,
  },
  fieldContainer: {
    gap: 8,
  },
  exemplosContainer: {
    gap: 6,
  },
  exemplo: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  cardGap: {
    gap: 10,
  },
});
