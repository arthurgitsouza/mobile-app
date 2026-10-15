import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  arquivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pdfIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  buttonGroup: {
    gap: 10,
  },
  verificationCard: {
    alignItems: 'center',
    gap: 10,
  },
  centerText: {
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btnFlex: {
    flex: 1,
  },
  bannerFullWidth: {
    alignSelf: 'stretch',
  },
});
