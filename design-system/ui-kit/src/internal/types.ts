import type { Spacing } from './constants';

type ValidateSpacing4<T extends string, D extends string> = T extends `${Spacing}${D}${infer _NO}`
  ? _NO extends `${Spacing}${D}${infer __O}`
    ? __O extends `${Spacing}${D}${infer __F}`
      ? __F extends Spacing
        ? T
        : never
      : never
    : never
  : never;

export type Padding<T extends string> = Spacing | ValidateSpacing4<T, ' '> | `${Spacing} ${Spacing}`;

export type BorderRadius<T extends string> = Spacing | ValidateSpacing4<T, ' '> | `${Spacing} ${Spacing}`;

export type ColorToken =
  | 'accent-bg-active'
  | 'accent-bg-default'
  | 'accent-bg-hover'
  | 'accent-over'
  | 'accent-text-and-icons'
  | 'accent-transparent'
  | 'card-bg-active'
  | 'card-bg-default'
  | 'card-bg-hover'
  | 'card-bg-inactive'
  | 'card-border'
  | 'chart-lines-grid'
  | 'chart-lines-line-1'
  | 'chart-lines-line-2'
  | 'const-1-green'
  | 'const-2-mustard'
  | 'const-3-orange'
  | 'const-4-blue'
  | 'const-5-pink'
  | 'const-6-cyan'
  | 'const-7-peach'
  | 'const-8-red'
  | 'const-9-violet'
  | 'contrast-primary'
  | 'contrast-quaternary'
  | 'contrast-secondary'
  | 'contrast-tertiary'
  | 'control-bg-active'
  | 'control-bg-default'
  | 'control-bg-hover'
  | 'control-bg-inactive'
  | 'control-border'
  | 'input-bg-active'
  | 'input-bg-default'
  | 'input-bg-hover'
  | 'input-bg-inactive'
  | 'input-border'
  | 'negative-bg-active'
  | 'negative-bg-default'
  | 'negative-bg-hover'
  | 'negative-over'
  | 'negative-text-and-icons'
  | 'negative-transparent'
  | 'positive-bg-active'
  | 'positive-bg-default'
  | 'positive-bg-hover'
  | 'positive-over'
  | 'positive-text-and-icons'
  | 'positive-transparent'
  | 'shadow-elevation-0'
  | 'shadow-elevation-1'
  | 'shadow-elevation-2'
  | 'shadow-elevation-3'
  | 'surface-canvas'
  | 'surface-elevation-1'
  | 'surface-elevation-2'
  | 'surface-elevation-3'
  | 'surface-overlay'
  | 'warning-bg-active'
  | 'warning-bg-default'
  | 'warning-bg-hover'
  | 'warning-over'
  | 'warning-text-and-icons'
  | 'warning-transparent';
