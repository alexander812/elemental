import { forwardRef, memo, useMemo } from 'react';

import classNames from 'classnames';

import { pxToRemWithUnit } from '../internal/utils';

import classes from './index.module.pcss';

type SpinnerSize = 'l' | 'm' | 's' | 'xl';

type SpinnerProps = {
  color?: keyof typeof hostColorClasses;
  dataTest?: string;
  size?: SpinnerSize | number;
};

const SPINNER_SIZE_MAP: Record<SpinnerSize, number> = {
  l: 32,
  m: 24,
  s: 16,
  xl: 48,
};

const hostColorClasses = {
  accent: classes.hostColorAccent,
  inherit: classes.hostColorInherit,
  neutral: classes.hostColorNeutral,
};

const Spinner = memo(
  forwardRef<HTMLDivElement, SpinnerProps>(({ color = 'accent', dataTest = 'Spinner', size = 'm' }, ref) => {
    const style = useMemo(
      () => ({ fontSize: pxToRemWithUnit(typeof size === 'number' ? size : SPINNER_SIZE_MAP[size]) }),
      [size],
    );

    return (
      <div
        className={classNames(classes.host, hostColorClasses[color])}
        data-test={dataTest}
        ref={ref}
        role="progressbar"
        style={style}
      >
        <div className={classes.bar} />
        <div className={classes.bar} />
        <div className={classes.bar} />
      </div>
    );
  }),
);

Spinner.displayName = 'Spinner';

export { Spinner };
