/**
 * BayaniHan "bold & youthful" theme.
 * Violet is the brand, coral is for actions, lime is the highlight (always with dark text).
 */
export const colors = {
  primary: '#6C3BFF',
  primaryDeep: '#4A1FCC',
  primarySoft: '#EEE8FF',
  accent: '#FF5A5F',
  accentDeep: '#D63A40',
  accentSoft: '#FFE8E8',
  lime: '#C8F34A',
  limeDeep: '#9BC41F',
  bg: '#F7F5FF',
  card: '#FFFFFF',
  sunken: '#EFEBFA',
  text: '#1A1530',
  muted: '#625C7A',
  faint: '#8E88A6',
  border: '#E6E1F5',
  danger: '#E5304A',
  dangerSoft: '#FFE5EA',
  success: '#12A26B',
  successSoft: '#DDF7EC',
  warning: '#FFA41B',
};

export const fonts = {
  heading: 'Nunito_900Black',
  headingBold: 'Nunito_900Black',
  body: 'Nunito_600SemiBold',
  medium: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
};

/** Type scale (size / line-height). */
export const type = {
  display: { fontSize: 34, lineHeight: 40 },
  h1: { fontSize: 30, lineHeight: 36 },
  h2: { fontSize: 21, lineHeight: 27 },
  h3: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  tiny: { fontSize: 11, lineHeight: 14 },
};

export const radius = { sm: 14, md: 22, lg: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const shadow = {
  shadowColor: '#3A1D99',
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

/** Depth of the "chunky" bottom edge on buttons and tiles; they sink by this much when pressed. */
export const chunk = 4;

/** 1 (slight) → 5 (severe). Each passes contrast with white bold text. */
export const severityColors = ['#12A26B', '#5E9E1A', '#C77A00', '#E8492E', '#D1213F'];
