import { forwardRef, memo, useMemo } from 'react';
import type { CSSProperties, ForwardedRef, JSX, PropsWithChildren, ReactElement, Ref } from 'react';

import classNames from 'classnames';

import { usePadding } from '../internal/hooks';
import type { BorderRadius, ColorToken, Padding } from '../internal/types';
import { mapColor, parsePxToRem } from '../internal/utils';

import classes from './index.module.pcss';

type CardColors =
  | 'accent'
  | 'control'
  | 'inactive'
  | 'input'
  | 'positiveTransparent'
  | 'primary'
  | 'surfaceCanvas'
  | 'surfaceElevation1'
  | 'surfaceElevation2'
  | 'transparent';

type CardProps<P extends string> = PropsWithChildren<{
  active?: boolean | undefined;
  borderColor?: ColorToken | undefined;
  borderRadius?: BorderRadius<P>;
  borderWidth?: number;
  clipContent?: boolean;
  color?: CardColors;
  dataTest?: string;
  disabled?: boolean;
  elevated?: boolean;
  fitContainer?: boolean;
  height?: CSSProperties['height'];
  noBorder?: boolean;
  onClick?: JSX.IntrinsicElements['div']['onClick'];
  padding?: Padding<P>;
  position?: CSSProperties['position'];
  textColor?: ColorToken;
  width?: CSSProperties['width'];
}>;

const cardColor: Record<CardColors, string> = {
  accent: classes.hostColorAccent,
  control: classes.hostColorControl,
  inactive: classes.hostColorInactive,
  input: classes.hostColorInput,
  positiveTransparent: classes.hostColorPositiveTransparent,
  primary: classes.hostColorPrimary,
  surfaceCanvas: classes.hostColorSurfaceCanvas,
  surfaceElevation1: classes.hostColorSurfaceElevation1,
  surfaceElevation2: classes.hostColorSurfaceElevation2,
  transparent: classes.hostColorTransparent,
};

const textColors: Record<CardColors, ColorToken> = {
  accent: 'accent-over',
  control: 'contrast-primary',
  inactive: 'contrast-primary',
  input: 'contrast-primary',
  positiveTransparent: 'positive-over',
  primary: 'contrast-primary',
  surfaceCanvas: 'contrast-primary',
  surfaceElevation1: 'contrast-primary',
  surfaceElevation2: 'contrast-primary',
  transparent: 'contrast-primary',
};

const CardInner = <P extends string>(
  {
    active,
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
