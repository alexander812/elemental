import { forwardRef, memo, useMemo } from 'react';
import type { CSSProperties, ForwardedRef, PropsWithChildren, ReactElement, Ref } from 'react';

import { usePadding } from '../internal/hooks';
import type { Padding } from '../internal/types';
import { parsePxToRem } from '../internal/utils';

import classes from './index.module.pcss';

type FlexboxProps = {
  direction?: CSSProperties['flexDirection'];
  grow?: boolean | undefined;
  shrink?: CSSProperties['flexShrink'];
};

const alignsMap: Record<string, string | undefined> = {
  end: 'flex-end',
  start: 'flex-start',
};

const resolveAlign = (align: string | undefined) =>
  align && alignsMap[align] ? alignsMap[align] : align;

type BoxProps<P extends string> = FlexboxProps &
  PropsWithChildren<{
    bottom?: CSSProperties['bottom'];
    dataTest?: string;
    dir?: CSSProperties['direction'];
    height?: CSSProperties['height'];
    horizontalAlign?: CSSProperties['justifyContent'];
    left?: CSSProperties['left'];
    maxHeight?: CSSProperties['height'];
    maxWidth?: CSSProperties['width'];
    minHeight?: CSSProperties['height'];
    minWidth?: CSSProperties['width'];
    padding?: Padding<P>;
    position?: CSSProperties['position'];
    right?: CSSProperties['right'];
    top?: CSSProperties['top'];
    verticalAlign?: CSSProperties['alignItems'];
    width?: CSSProperties['width'];
    zIndex?: CSSProperties['zIndex'];
  }>;

const BoxInternal = <P extends string>(
  {
    bottom,
    children,
    dataTest,
    dir,
    direction = 'column',
    grow,
    height,
    horizontalAlign,
    left,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    padding,
    position,
    right,
    shrink,
    top,
    verticalAlign,
    width,
    zIndex,
  }: BoxProps<P>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement => {
  const calculatedPadding = usePadding(padding);

  const isHorizontal = direction === 'row' || direction === 'row-reverse';

  const style = useMemo<CSSProperties>(
    () => ({
      alignItems: isHorizontal ? resolveAlign(verticalAlign) : resolveAlign(horizontalAlign),
      bottom: parsePxToRem(bottom),
      display: 'flex',
      flexDirection: direction,
      flexGrow: grow ? 1 : void 0,
      flexShrink: shrink,
      height: parsePxToRem(height),
      insetInlineEnd: parsePxToRem(right),
      insetInlineStart: parsePxToRem(left),
      justifyContent: isHorizontal ? resolveAlign(horizontalAlign) : resolveAlign(verticalAlign),
      maxHeight: parsePxToRem(maxHeight),
      maxWidth: parsePxToRem(maxWidth),
      minHeight: parsePxToRem(minHeight),
      minWidth: parsePxToRem(minWidth),
      padding: calculatedPadding,
      position: position,
      top: parsePxToRem(top),
      width: parsePxToRem(width),
      zIndex: zIndex ?? void 0,
    }),
    [
      position,
      top,
      left,
      right,
      bottom,
      isHorizontal,
      calculatedPadding,
      minWidth,
      width,
      maxWidth,
      minHeight,
      height,
      maxHeight,
      verticalAlign,
      horizontalAlign,
      direction,
      grow,
      shrink,
      zIndex,
    ],
  );

  return (
    <div className={classes.host} data-direction={direction} data-test={dataTest} dir={dir} ref={ref} style={style}>
      {children}
    </div>
  );
};

const Box = memo(forwardRef(BoxInternal)) as <P extends string>(
  _: BoxProps<P> & { ref?: Ref<HTMLDivElement> | undefined },
) => ReactElement;

export { Box };
export type { BoxProps };
