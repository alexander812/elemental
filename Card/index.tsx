import { forwardRef, memo, useMemo } from 'react';
import type { CSSProperties, ForwardedRef, JSX, PropsWithChildren, ReactElement, Ref } from 'react';

import classNames from 'classnames';
import type { Property } from 'csstype';

import { usePadding } from '../internal/hooks';
import type { BorderRadius, ColorToken, Padding } from '../internal/types';
import { mapColor, parsePxToRem } from '../internal/utils';

import classes from './index.module.pcss';

type CardColors =
  | 'accent'
  | 'accentTransparent'
  | 'control'
  | 'inactive'
  | 'input'
  | 'positiveTransparent'
  | 'primary'
  | 'primaryBlur'
  | 'primaryContrast'
  | 'surfaceCanvas'
  | 'surfaceElevation1'
  | 'surfaceElevation2'
  | 'surfaceOverlay'
  | 'transparent'
  | 'warning';

type CardProps<P extends string> = PropsWithChildren<{
  active?: boolean | undefined;
  ai?: boolean;
  borderColor?: ColorToken | undefined;
  borderRadius?: BorderRadius<P>;
  borderWidth?: number;
  clipContent?: boolean;
  color?: CardColors;
  dataTest?: string;
  disabled?: boolean;
  elevated?: boolean;
  fitContainer?: boolean;
  height?: Property.Height;
  noBorder?: boolean;
  /**
   * Use this property if u have no clickable elements inside card (e.g. close icons)
   */
  onClick?: JSX.IntrinsicElements['div']['onClick'];
  /**
   * Padding size to apply to the component
   * @default 'L'
   */
  padding?: Padding<P>;

  position?: Property.Position;
  textColor?: ColorToken;
  width?: Property.Width;
}>;

/**
 * Group related content for easier scannability in a styled, often interactive box.
 *
 * @example
 * ```tsx
 * <Card>Content here</Card>
 * ```
 */

const cardColor: Record<CardColors, string> = {
  accent: classes.hostColorAccent,
  accentTransparent: classes.hostColorAccentTransparent,
  control: classes.hostColorControl,
  inactive: classes.hostColorInactive,
  input: classes.hostColorInput,
  positiveTransparent: classes.hostColorPositiveTransparent,
  primary: classes.hostColorPrimary,
  primaryBlur: classes.hostColorPrimaryBlur,
  primaryContrast: classes.hostColorPrimaryContrast,
  surfaceCanvas: classes.hostColorSurfaceCanvas,
  surfaceElevation1: classes.hostColorSurfaceElevation1,
  surfaceElevation2: classes.hostColorSurfaceElevation2,
  surfaceOverlay: classes.hostColorSurfaceOverlay,
  transparent: classes.hostColorTransparent,
  warning: classes.hostColorWarning,
};

const textColors: Record<CardColors, ColorToken> = {
  accent: 'accent-over',
  accentTransparent: 'accent-over',
  control: 'contrast-primary',
  inactive: 'contrast-primary',
  input: 'contrast-primary',
  positiveTransparent: 'positive-over',
  primary: 'contrast-primary',
  primaryBlur: 'contrast-primary',
  primaryContrast: 'surface-canvas',
  surfaceCanvas: 'contrast-primary',
  surfaceElevation1: 'contrast-primary',
  surfaceElevation2: 'contrast-primary',
  surfaceOverlay: 'contrast-primary',
  transparent: 'contrast-primary',
  warning: 'contrast-primary',
};

const CardInner = <P extends string>(
  {
    active,
    ai,
    borderColor,
    borderRadius = 'm',
    borderWidth = 1,
    children,
    clipContent,
    color = 'primary',
    dataTest,
    disabled,
    elevated = false,
    fitContainer,
    height,
    noBorder,
    onClick,
    padding = 'm',
    position,
    textColor,
    width,
  }: CardProps<P>,
  ref: ForwardedRef<HTMLDivElement>,
  // eslint-disable-next-line complexity
) => {
  const calculatedPadding = usePadding(padding);
  const calculatedRadius = usePadding(borderRadius);

  const style = useMemo<CSSProperties>(
    () => ({
      '--border-width': parsePxToRem(borderWidth),
      borderColor: borderColor ? mapColor(borderColor) : void 0,
      borderRadius: calculatedRadius,
      color: mapColor(textColor ?? textColors[color]),
      height: parsePxToRem(height),
      maxHeight: fitContainer ? '100%' : void 0,
      maxWidth: fitContainer ? '100%' : void 0,
      minHeight: 0,
      minWidth: width === '100%' ? 0 : void 0,
      padding: calculatedPadding,
      position: position,
      width: parsePxToRem(width),
    }),
    [
      borderWidth,
      calculatedPadding,
      color,
      borderColor,
      textColor,
      fitContainer,
      calculatedRadius,
      height,
      width,
      position,
    ],
  );

  return (
    <div
      className={classNames(
        classes.host,
        {
          [classes.hostActive]: active,
          [classes.hostAi]: ai,
          [classes.hostClickable]: !!onClick && !disabled,
          [classes.hostClipContent]: clipContent,
          [classes.hostDisabled]: disabled,
          [classes.hostElevated]: elevated,
          [classes.hostNoBorder]: noBorder,
        },
        cardColor[color],
      )}
      data-test={dataTest}
      ref={ref}
      style={style}
      onClick={disabled ? void 0 : onClick}
    >
      {children}
    </div>
  );
};

const Card = memo(forwardRef(CardInner)) as <P extends string>(
  _: CardProps<P> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;

CardInner.displayName = 'Card';

export { Card };
