import { forwardRef, memo } from 'react';

import classNames from 'classnames';

import { Text } from '../Text';

import classes from './index.module.pcss';

type CounterColor =
  | 'accent'
  | 'contrastPrimary'
  | 'contrastQuaternary'
  | 'contrastSecondary'
  | 'contrastTertiary'
  | 'negative'
  | 'positive'
  | 'surfaceElevation'
  | 'warning';

type CounterProps = {
  color?: CounterColor;
  count: number;
  dataTest?: string;
  disabled?: boolean | undefined;
  max?: number;
};

const hostColorClasses = {
  accent: classes.hostColorAccent,
  contrastPrimary: classes.hostColorContrastPrimary,
  contrastQuaternary: classes.hostColorContrastQuaternary,
  contrastSecondary: classes.hostColorContrastSecondary,
  contrastTertiary: classes.hostColorContrastTertiary,
  negative: classes.hostColorNegative,
  positive: classes.hostColorPositive,
  surfaceElevation: classes.hostColorSurfaceElevation,
  warning: classes.hostColorWarning,
};

const formatValue = (count: number, max: number): string => {
  return count > max ? `${max}+` : String(count);
};

const Counter = memo(
  forwardRef<HTMLSpanElement, CounterProps>(
    ({ color = 'accent', count, dataTest = 'Counter', disabled, max = 99 }, ref) => {
      return (
        <span
          className={classNames(classes.host, hostColorClasses[color], {
            [classes.disabled]: disabled,
          })}
          data-disabled={disabled}
          data-test={dataTest}
          ref={ref}
        >
          <Text as="span" lineHeight={1} variant="XXS / Mono Num">
            {formatValue(count, max)}
          </Text>
        </span>
      );
    },
  ),
);

Counter.displayName = 'Counter';

export type { CounterColor };
export { Counter };
