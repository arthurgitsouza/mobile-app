// Identidade visual do RDO Mobile.
// Paleta baseada na identidade da Planengen (azul #0084F4, azul escuro #010028, cinzas #EEF0F2 e #202020):
// tons de azul para cabeçalho e ações, com dourado como destaque (aprovações/assinaturas).
// Os nomes (navy700, blue500...) foram mantidos de propósito: só os valores mudaram.
// Este módulo é JS puro (sem imports do React Native) para poder ser usado por testes e domínio.

export const colors = {
  navy900: '#010028',
  navy800: '#06308A',
  navy700: '#0B5BC4',
  navy600: '#0066C4',
  blue500: '#0066C4',
  blue200: '#B3D9FC',
  blue100: '#DCEEFE',
  blue50: '#EEF5FD',

  gold600: '#B98322',
  gold500: '#D9A441',
  gold200: '#F3DDA6',
  gold100: '#FFF1CF',
  gold50: '#FFF8E6',
  goldText: '#6B4700',

  bg: '#EEF0F2',
  surface: '#FFFFFF',
  border: '#D7E0EB',
  borderStrong: '#B4C3D5',
  divider: '#E6ECF3',

  text: '#202020',
  textMuted: '#4E617A',
  textSubtle: '#5A6C85',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#DCEEFE',

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

  overlay: 'rgba(1, 0, 40, 0.55)',
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
  rascunho: { label: 'Rascunho', color: colors.gray, bg: colors.grayBg, icon: 'pencil-outline', barra: colors.gray },
  submetido: { label: 'Submetido', color: '#0B5BC4', bg: '#DCEEFE', icon: 'send-outline', barra: '#A5D2FD' },
  em_analise: { label: 'Em análise', color: '#06308A', bg: '#B3D9FC', icon: 'magnify', barra: '#62B2F9' },
  devolvido: {
    label: 'Devolvido',
    color: colors.warning,
    bg: colors.warningBg,
    icon: 'undo-variant',
    barra: '#0084F4',
  },
  validado: { label: 'Validado', color: '#FFFFFF', bg: '#0B5BC4', icon: 'check-decagram-outline', barra: '#0B5BC4' },
  enviado_cliente: {
    label: 'Enviado ao cliente',
    color: colors.info,
    bg: colors.infoBg,
    icon: 'account-arrow-right-outline',
    barra: '#06308A',
  },
  finalizado: {
    label: 'Finalizado',
    color: colors.success,
    bg: colors.successBg,
    icon: 'check-circle-outline',
    barra: '#010028',
  },
  retificado: { label: 'Retificado', color: '#06308A', bg: '#EEF5FD', icon: 'file-restore-outline', barra: '#6F86B3' },
  cancelado: {
    label: 'Cancelado',
    color: colors.danger,
    bg: colors.dangerBg,
    icon: 'file-cancel-outline',
    barra: colors.danger,
  },
};

export const criticidadeMeta = {
  baixa: { label: 'Baixa', color: colors.success, bg: colors.successBg },
  media: { label: 'Média', color: colors.info, bg: colors.infoBg },
  alta: { label: 'Alta', color: colors.warning, bg: colors.warningBg },
  critica: { label: 'Crítica', color: colors.danger, bg: colors.dangerBg },
};
