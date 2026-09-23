// Identidade visual do RDO Mobile.
// Paleta inspirada no exemplo de RDO do documento-base: azul-marinho (cabeçalho),
// azul de seção e dourado como destaque (aprovações/assinaturas).
// Este módulo é JS puro (sem imports do React Native) para poder ser usado por testes e domínio.

export const colors = {
  navy900: '#0C2038',
  navy800: '#11294A',
  navy700: '#17375E',
  navy600: '#1F4E79',
  blue500: '#2F6FB3',
  blue200: '#B9D3EE',
  blue100: '#E3EEFB',
  blue50: '#F1F6FC',

  gold600: '#B98322',
  gold500: '#D9A441',
  gold200: '#F3DDA6',
  gold100: '#FFF1CF',
  gold50: '#FFF8E6',
  goldText: '#6B4700',

  bg: '#F3F6FA',
  surface: '#FFFFFF',
  border: '#D7E0EB',
  borderStrong: '#B4C3D5',
  divider: '#E6ECF3',

  text: '#14253B',
  textMuted: '#4E617A',
  textSubtle: '#71849C',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#B7C7DC',

  success: '#1B6E45',
  successBg: '#DDF3E6',
  warning: '#9A4F00',
  warningBg: '#FDEBD3',
  danger: '#B0281C',
  dangerBg: '#FDE4E1',
  info: '#0A5F99',
  infoBg: '#DDF0FB',
  purple: '#5535B0',
  purpleBg: '#ECE6FA',
  teal: '#0B6B63',
  tealBg: '#DAF2EF',
  gray: '#465870',
  grayBg: '#E9EEF4',

  overlay: 'rgba(12, 32, 56, 0.55)',
  white: '#FFFFFF',
  black: '#000000',
};

// Tokens de gráficos: categorias 1–3 e rampa sequencial da paleta validada (skill dataviz,
// modo claro; validate_palette.js passa em todos os pares — o aqua fica <3:1 no branco e por isso
// todo gráfico traz rótulos visíveis + visão em tabela). Status: cor + ícone + rótulo, nunca só cor.
export const chart = {
  series: ['#2a78d6', '#eb6834', '#1baf7a'],
  seq: { 100: '#cde2fb', 250: '#86b6ef', 400: '#3987e5', 450: '#2a78d6', 550: '#1c5cab', 700: '#0d366b' },
  track: '#E6ECF3',
  grid: '#E1E6EE',
  axis: '#B4C3D5',
  neutral: '#B7C3D2',
  deltaGood: '#006300',
  deltaBad: '#B0281C',
  status: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  smallStrong: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 0.6 },
};

// Cor/rótulo por estado do RDO (seção 5 do documento + "devolvido" do fluxo de análise).
export const statusMeta = {
  rascunho: { label: 'Rascunho', color: colors.gray, bg: colors.grayBg, icon: 'pencil-outline' },
  submetido: { label: 'Submetido', color: colors.info, bg: colors.infoBg, icon: 'send-outline' },
  em_analise: { label: 'Em análise', color: colors.purple, bg: colors.purpleBg, icon: 'magnify' },
  devolvido: { label: 'Devolvido', color: colors.warning, bg: colors.warningBg, icon: 'undo-variant' },
  validado: { label: 'Validado', color: colors.teal, bg: colors.tealBg, icon: 'check-decagram-outline' },
  enviado_cliente: { label: 'Enviado ao cliente', color: colors.info, bg: colors.infoBg, icon: 'account-arrow-right-outline' },
  finalizado: { label: 'Finalizado', color: colors.success, bg: colors.successBg, icon: 'check-circle-outline' },
  retificado: { label: 'Retificado', color: colors.goldText, bg: colors.gold100, icon: 'file-restore-outline' },
  cancelado: { label: 'Cancelado', color: colors.danger, bg: colors.dangerBg, icon: 'file-cancel-outline' },
};

export const criticidadeMeta = {
  baixa: { label: 'Baixa', color: colors.success, bg: colors.successBg },
  media: { label: 'Média', color: colors.info, bg: colors.infoBg },
  alta: { label: 'Alta', color: colors.warning, bg: colors.warningBg },
  critica: { label: 'Crítica', color: colors.danger, bg: colors.dangerBg },
};
