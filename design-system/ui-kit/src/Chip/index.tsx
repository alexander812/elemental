import { forwardRef, memo, useCallback } from 'react';
import type { JSX, MouseEventHandler, ReactNode } from 'react';

import classNames from 'classnames';

import type { CounterColor } from '../Counter';
import { Counter } from '../Counter';
import { useIcon } from '../IconsProvider';
import { Spinner } from '../Spinner';
import { Text } from '../Text';
import type { TextVariant } from '../Text';

import classes from './index.module.pcss';

type ChipColor = 'onAccent' | 'primary' | 'secondary' | 'tertiary';
type ChipVariant = 'contained' | 'outlined';

type JSXButtonProps = JSX.IntrinsicElements['button'];

type ChipProps = {
  checked?: boolean;
  color?: ChipColor;
  counter?: number | undefined;
  counterColor?: CounterColor;
  dataTest?: string;
  disabled?: boolean;
  endIcon?: ReactNode;
  label: ReactNode;
  labelVariant?: TextVariant;
  loading?: boolean;
  onClick?: JSXButtonProps['onClick'];
  onClose?: (() => void) | undefined;
  showIconOnHover?: boolean;
  size?: 'm' | 's';
  startIcon?: ReactNode;
  variant?: ChipVariant | undefined;
};

const hostSizeClasses = {
  m: classes.hostSizeM,
  s: classes.hostSizeS,
};

const textSizes = {
  m: 'S Compact / Medium',
  s: 'XS / Medium',
} as const;

const spinnerSizes = {
  m: 'm',
  s: 's',
} as const;

const hostColorClasses = {
  onAccent: classes.hostColorOnAccent,
  primary: classes.hostColorPrimary,
  secondary: classes.hostColorSecondary,
  tertiary: classes.hostColorTertiary,
};

const hostVariantClasses = {
  contained: classes.hostVariantContained,
  outlined: classes.hostVariantOutlined,
};

/**
 * Chip component is a button-like interactive element with toggling.
 * @example
 * ```tsx
 * <Chip label="Chip" />
 * ```
 */
const Chip = memo(
  forwardRef<HTMLButtonElement, ChipProps>(
    (
      {
        checked,
        color = 'secondary',
        counter,
        counterColor = 'accent',
        dataTest = 'Chip',
        disabled,
        endIcon,
        label,
        labelVariant,
        loading = false,
        onClick,
        onClose,
        showIconOnHover = false,
        size = 'm',
        startIcon,
        variant = 'contained',
      },
      ref,
    ) => {
      const hasCounter = typeof counter === 'number';

      const closeIcon = useIcon('close', {
        size: 16,
      });

      const spinner = loading ? (
        <div className={classes.spinner}>
          <Spinner color="neutral" size={spinnerSizes[size]} />
        </div>
      ) : null;

      const handleClose: MouseEventHandler<HTMLDivElement> = useCallback(
        (e) => {
          e.stopPropagation();
          onClose?.();
        },
        [onClose],
      );

      return (
        <button
          className={classNames(
            classes.host,
            onClick && classes.hostHasInteraction,
            hostSizeClasses[size],
            hostColorClasses[color],
            hostVariantClasses[variant],
            {
              [classes.hostChecked]: checked,
              [classes.hostWithCloseIcon]: Boolean(onClose),
              [classes.hostWithCounter]: hasCounter,
              [classes.hostWithEndIcon]: Boolean(endIcon),
              [classes.hostWithStartIcon]: Boolean(startIcon),
            },
            loading && classes.hostLoading,
          )}
          data-test={dataTest}
          aria-pressed={checked}
          disabled={loading || disabled}
          ref={ref}
          type="button"
          onClick={onClick}
        >
          <div className={classes.content}>
            <div className={classNames(classes.icon, showIconOnHover && classes.iconShowOnHover)}>
              {startIcon}
            </div>
            <div
              className={classNames(classes.endBlock, {
                [classes.endBlockWithCounter]: hasCounter,
              })}
            >
              <Text as="span" lineHeight={1} overflow="nowrap" variant={labelVariant ?? textSizes[size]}>
                {label}
              </Text>
              {hasCounter ? <Counter color={counterColor} count={counter} disabled={disabled} /> : null}
              <div className={classNames(classes.icon, showIconOnHover && classes.iconShowOnHover)}>
                {endIcon}
              </div>
            </div>
            {onClose ? (
              <div
                className={classNames(classes.closeIcon, disabled && classes.closeIconDisabled)}
                onClick={handleClose}
              >
                {closeIcon}
              </div>
            ) : null}
          </div>
          {spinner}
        </button>
      );
    },
  ),
);

Chip.displayName = 'Chip';

export { Chip };
export type { ChipProps };
