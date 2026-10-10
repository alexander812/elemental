import colors from './colors.json';
import type { Tokens } from './types';

type Theme = 'dark' | 'light' | 'terracotta' | 'midnight' | 'stone' | 'amethyst';
const themesColors = colors as Record<Theme, Tokens>;

export { themesColors, type Theme, type Tokens };
