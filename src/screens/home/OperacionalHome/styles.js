import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy700,
    borderRadius: radius.xl,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.navy600,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  dica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressInfo: {
    flex: 1,
    gap: 2,
  },
  offlineCard: {
    flexDirection: 'row',
    gap: 10,
  },
});
