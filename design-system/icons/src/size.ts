const defaultSizes = {
  l: 32,
  m: 24,
  s: 16,
} as const;

const baseFontSize = 16;

type DefaultSize = keyof typeof defaultSizes;

function pxToRem(value: number, fontSize?: number): number {
  fontSize = fontSize ?? baseFontSize;
  return value / fontSize;
}

function pxToRemWithUnit(value: number, fontSize?: number): string {
  return `${pxToRem(value, fontSize)}rem`;
}

export type IconSize = DefaultSize | number;

export const getSize = <T extends string | number>(spacing: IconSize | string): T => {
  if (typeof spacing === 'number') {
    return pxToRemWithUnit(spacing, baseFontSize) as T;
  }

  if (spacing && spacing in defaultSizes) {
    return pxToRemWithUnit(defaultSizes[spacing as DefaultSize], baseFontSize) as T;
  }

  return spacing as T;
};
