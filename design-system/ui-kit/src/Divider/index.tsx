import type { CSSProperties, FC } from 'react';
import { memo, useMemo } from 'react';

import classNames from 'classnames';

import type { ColorToken } from '../internal/types';
import { mapColor, parsePxToRem } from '../internal/utils';

import classes from './index.module.pcss';

type DividerDirection = 'horizontal' | 'vertical';

type DividerProps = {
  color?: ColorToken;
  direction?: DividerDirection;
  height?: CSSProperties['height'];
  width?: CSSProperties['width'];
};

const hostDirectionClasses: Record<DividerDirection, string> = {
  horizontal: classes.hostDirectionHorizontal,
  vertical: classes.hostDirectionVertical,
};

const Divider: FC<DividerProps> = memo(({ color = 'contrast-quaternary', direction = 'horizontal', height, width }) => {
  const style = useMemo<CSSProperties>(
    () => ({
      backgroundColor: mapColor(color),
      height: parsePxToRem(height),
      width: parsePxToRem(width),
    }),
    [height, width, color],
  );

  return <div className={classNames(classes.host, hostDirectionClasses[direction])} style={style} />;
});

Divider.displayName = 'Divider';

export { Divider };
