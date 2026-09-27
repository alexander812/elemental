import { baseFontSize, spacingMap } from '../constants';
import type { Spacing } from '../constants';

const calculateSizeCache: Record<string, string | undefined> = {};

function pxToRem(value: number, fontSize: number = baseFontSize): number {
  return value / fontSize;
}

function pxToRemWithUnit(value: number, fontSize: number = baseFontSize): string {
  return `${pxToRem(value, fontSize)}rem`;
}

const calculateSize = <T extends number | string | void>(spacing: Spacing | string | void): T => {
  if (spacing) {
    const cache = calculateSizeCache[spacing];

    if (cache) return cache as T;

    if (spacing in spacingMap) {
      calculateSizeCache[spacing] = pxToRemWithUnit(spacingMap[spacing as Spacing]);

      return calculateSizeCache[spacing] as T;
    }
  }

  return spacing as T;
};

const parsePxToRemCache: Record<string, string | undefined> = {};

const parsePxToRem = (
  value: string | number | undefined,
  fontSize: number = baseFontSize,
): string | number | undefined => {
  if (value !== void 0) {
    const cache = parsePxToRemCache[value];

    if (cache) return cache;

    if (typeof value === 'number') {
      parsePxToRemCache[value] = `${value}px`;

      return parsePxToRemCache[value];
    }

    if (value.endsWith('px')) {
      const parsed = parseFloat(value);

      if (Number.isNaN(parsed)) return value;

      parsePxToRemCache[value] = pxToRemWithUnit(parsed, fontSize);

      return parsePxToRemCache[value];
    }
  }

  return value;
};

export { calculateSize, parsePxToRem, pxToRem, pxToRemWithUnit };
