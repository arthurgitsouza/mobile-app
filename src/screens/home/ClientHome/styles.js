import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy700,
    borderRadius: radius.xl,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.navy600,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroNum: {
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -2,
  },
  heroTextFlex: {
    flex: 1,
  },
  cardGapSmall: {
    gap: 8,
  },
  cardGapMedium: {
    gap: 10,
  },
  cardGapLarge: {
    gap: 12,
  },
  progressContainer: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  evento: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
