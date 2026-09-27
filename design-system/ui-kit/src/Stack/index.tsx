import type { CSSProperties, PropsWithChildren } from 'react';
import { forwardRef, useMemo } from 'react';

import type { Spacing } from '../internal/constants';
import { calculateSize } from '../internal/utils';

import classes from './index.module.pcss';

const alignsMap: Record<string, string | undefined> = {
  end: 'flex-end',
  start: 'flex-start',
};

const resolveAlign = (align: string | undefined) =>
  align && alignsMap[align] ? alignsMap[align] : align;

type FlexboxProps = {
  direction?: CSSProperties['flexDirection'];
  grow?: boolean | undefined;
  shrink?: CSSProperties['flexShrink'];
};

type StackProps = FlexboxProps &
  PropsWithChildren<{
    dataTest?: string;
    height?: CSSProperties['height'];
    horizontalAlign?: CSSProperties['justifyContent'];
    maxHeight?: CSSProperties['maxHeight'];
    maxWidth?: CSSProperties['maxWidth'];
    minHeight?: CSSProperties['minHeight'];
    minWidth?: CSSProperties['minWidth'];
    position?: 'relative' | 'static';
    spacing?: Spacing;
    verticalAlign?: CSSProperties['alignItems'];
    width?: CSSProperties['width'];
    wrap?: CSSProperties['flexWrap'];
  }>;

const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      children,
      dataTest,
      direction = 'column',
      grow,
      height,
      horizontalAlign,
      maxHeight,
      maxWidth,
      minHeight,
      minWidth,
      position,
      shrink,
      spacing,
      verticalAlign,
      width,
      wrap = 'nowrap',
    },
    ref,
  ) => {
    const hostStyle = useMemo<CSSProperties>(() => {
      const isHorizontal = direction === 'row' || direction === 'row-reverse';

      return {
        alignItems: isHorizontal ? resolveAlign(verticalAlign) : resolveAlign(horizontalAlign),
        display: 'flex',
        flexDirection: direction,
        flexGrow: grow ? 1 : void 0,
        flexShrink: shrink,
        flexWrap: wrap,
        gap: calculateSize(spacing) ?? 0,
        height: height ?? void 0,
        justifyContent: isHorizontal ? resolveAlign(horizontalAlign) : resolveAlign(verticalAlign),
        maxHeight: maxHeight ?? void 0,
        maxWidth: maxWidth ?? void 0,
        minHeight: minHeight ?? void 0,
        minWidth: minWidth ?? void 0,
        position,
        width: width ?? void 0,
      };
    }, [
      maxHeight,
      wrap,
      horizontalAlign,
      verticalAlign,
      spacing,
      direction,
      position,
      height,
      width,
      maxWidth,
      minHeight,
      minWidth,
      grow,
      shrink,
    ]);

    return (
      <div className={classes.host} data-test={dataTest} ref={ref} style={hostStyle}>
        {children}
      </div>
    );
  },
);

Stack.displayName = 'Stack(ui-kit)';

export { Stack };
