import type { ColorToken } from '../types';

const colorCache: Record<string, string | undefined> = {};

export const mapColor = (color?: ColorToken | 'transparent'): string | undefined => {
  if (!color) return color;

  if (color === 'transparent') return color;

  const cache = colorCache[color];

  if (cache) return cache;

  colorCache[color] = `var(--${color})`;

  return colorCache[color];
};
