export type Spacing = '0' | '3xl' | '4xl' | '5xl' | '6xl' | 'l' | 'm' | 's' | 'xl' | 'xs' | 'xxl' | 'xxs';

export const baseFontSize = 16;

export const spacingMap: Record<Spacing, number> = {
  0: 0,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 80,
  l: 16,
  m: 12,
  s: 8,
  xl: 20,
  xs: 4,
  xxl: 24,
  xxs: 2,
};
