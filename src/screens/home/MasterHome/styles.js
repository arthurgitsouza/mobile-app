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
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  cardGapMedium: {
    gap: 10,
  },
  cardGapSmall: {
    gap: 6,
  },
  cardGapLarge: {
    gap: 12,
  },
  progressContainer: {
    gap: 4,
  },
  noRdoText: {
    fontWeight: '800',
  },
  vencida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.dangerBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vencidaText: {
    fontWeight: '800',
  },
  evento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  atalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 64,
  },
  pressed: {
    opacity: 0.85,
  },
  atalhoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
