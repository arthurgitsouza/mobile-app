import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  tabsMargin: {
    marginTop: 8,
  },
  groupContainer: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  naoLida: {
    borderColor: colors.navy600,
    backgroundColor: colors.blue50,
  },
  pressed: {
    opacity: 0.9,
  },
  icone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold500,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalCardGap: {
    gap: 8,
  },
  bannerButtonContainer: {
    marginTop: 8,
  },
  canal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  flexOne: {
    flex: 1,
  },
  email: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
    backgroundColor: colors.white,
  },
  emailDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 6,
  },
});
