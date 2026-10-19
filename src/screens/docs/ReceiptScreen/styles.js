import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  btnFlex: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  cardGap: {
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verificationCard: {
    gap: 12,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  bannerFullWidth: {
    alignSelf: 'stretch',
  },
});
