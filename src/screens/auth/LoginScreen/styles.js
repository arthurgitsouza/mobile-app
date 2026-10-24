import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../theme';

export const styles = StyleSheet.create({
  titulo: { marginTop: 14 },
  descricao: { textAlign: 'center', maxWidth: 320 },
  flex: { flex: 1 },
  persona: { flex: 1, gap: 1 },
  centro: { textAlign: 'center' },
  acessoRapido: { gap: 10 },
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.navy700,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingBottom: 64,
    borderBottomWidth: 4,
    borderBottomColor: colors.gold500,
  },
  proto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243,221,166,0.4)',
  },
  body: { paddingHorizontal: 16, marginTop: -40, gap: 20 },
  formCard: { gap: 14, padding: 18 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  quick: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  footer: { alignItems: 'center', gap: 6, paddingTop: 4 },
});

export const dinamico = {
  conteudo: (bottom) => ({ paddingBottom: bottom + 24 }),
  hero: (top) => ({ paddingTop: top + 28 }),
};
