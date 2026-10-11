import { forwardRef, memo } from 'react';

import classNames from 'classnames';

import classes from './index.module.pcss';

type ProgressBarProps = {
  className?: string;
  dataTest?: string;
  value: number;
};

const ProgressBar = memo(
  forwardRef<HTMLDivElement, ProgressBarProps>(
    ({ className, dataTest = 'ProgressBar', value }, ref) => {
      const progress = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

      return (
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(progress * 100)}
          className={classNames(classes.host, className)}
          data-test={dataTest}
          ref={ref}
          role="progressbar"
        >
          <div className={classes.bar} style={{ width: `${progress * 100}%` }} />
        </div>
      );
    },
  ),
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
export type { ProgressBarProps };
