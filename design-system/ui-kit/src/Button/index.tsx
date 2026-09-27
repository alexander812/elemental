import type { AriaAttributes, CSSProperties, JSX, ReactElement, ReactNode, Ref } from 'react';
import { forwardRef, memo, useMemo } from 'react';

import classNames from 'classnames';

import { Box } from '../Box';
import type { Spacing } from '../internal/constants';
import type { Padding } from '../internal/types';
import { calculateSize, parsePxToRem } from '../internal/utils';
import { Spinner } from '../Spinner';
import { Stack } from '../Stack';
import type { TextVariant } from '../Text';
import { Text } from '../Text';

import classes from './index.module.pcss';

type JSXButtonProps = JSX.IntrinsicElements['button'];

type ButtonVariant = 'flat' | 'primary' | 'secondary';
type ButtonColor = 'accent' | 'negative' | 'neutral' | 'positive' | 'warning';

type ButtonSize = 'm' | 's' | 'xs' | 'xxs';
type ButtonGap = Spacing;

type ButtonHorizontalAlign = 'center' | 'end' | 'start';

type ButtonProps<P extends string> = Pick<
  JSXButtonProps,
  'disabled' | 'form' | 'onClick' | 'onPointerDown' | 'onPointerLeave' | 'onPointerUp' | 'type'
> & {
    ariaLabel?: AriaAttributes['aria-label'];
    borderRadius?: Spacing;
    checked?: boolean;
    children?: ReactNode;
    color?: ButtonColor;
    counter?: ReactNode;
    dataTest?: string;
    endIcon?: ReactNode;
    focused?: boolean;
    fullWidth?: boolean;
    gap?: ButtonGap;
    height?: CSSProperties['height'];
    horizontalAlign?: ButtonHorizontalAlign;
    loading?: boolean;
    noWrap?: boolean;
    padding?: Padding<P>;
    round?: boolean;
    size?: ButtonSize;
    startIcon?: ReactNode;
    textOverflow?: 'ellipsis';
    variant?: ButtonVariant;
  };

const FakeIcon = memo(() => {
  return <span className={classes.fakeIcon} />;
});

const hostVariantClasses = {
  flat: classes.hostVariantFlat,
  primary: classes.hostVariantPrimary,
  secondary: classes.hostVariantSecondary,
};

const hostColorClasses = {
  accent: classes.hostColorAccent,
  negative: classes.hostColorNegative,
  neutral: classes.hostColorNeutral,
  positive: classes.hostColorPositive,
  warning: classes.hostColorWarning,
};

const textAlignClasses = {
  center: classes.textBoxAlignCenter,
  end: classes.textBoxAlignEnd,
  start: classes.textBoxAlignStart,
};

const mainTextSizes: Record<ButtonSize, TextVariant> = {
  m: 'M Compact / Mono Num',
  s: 'S Compact / Mono Num',
  xs: 'S Compact / Mono Num',
  xxs: 'XS / Mono Num',
};

const spinnerSizes = {
  m: 'm',
  s: 'm',
  xs: 's',
  xxs: 's',
} as const;

const contentInlinePadding: Record<ButtonSize, Spacing> = {
  m: 'm',
  s: 'm',
  xs: 'm',
  xxs: 's',
};

const contentBlockPadding: Record<ButtonSize, Spacing> = {
  m: 'm',
  s: 's',
  xs: 'xs',
  xxs: '0',
};

const roundRadius = calculateSize('50px');

  const ButtonInner = <P extends string>(
  {
    ariaLabel,
    borderRadius = 's',
    checked,
    children,
    color,
    counter,
    dataTest = 'Button',
    disabled,
    endIcon,
    focused,
    fullWidth,
    gap = 'm',
    height,
    horizontalAlign,
    loading,
    noWrap,
    onClick,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
    padding,
    round,
    size = 'm',
    startIcon,
    textOverflow,
    type = 'button',
    variant = 'primary',
  }: ButtonProps<P>,
  ref: Ref<HTMLButtonElement>,
) => {
  color = color ?? (variant === 'secondary' ? 'neutral' : 'accent');
  horizontalAlign = horizontalAlign ?? 'center';

  const style = useMemo<CSSProperties>(() => {
    const r = round ? roundRadius : calculateSize(borderRadius);

    return {
      ['--btn-focus-radius']: r,
      borderRadius: r,
      height: parsePxToRem(height),
    } as CSSProperties;
  }, [borderRadius, height, round]);

  const shouldRenderMainText =
    children !== undefined && children !== null && children !== false && children !== '';

  const shouldRenderLoader = !!loading;

  const shouldRenderStartIcon = !!startIcon;
  const shouldRenderEndIcon = !!endIcon;

  const shouldRenderFakeStartIcon =
    horizontalAlign === 'center' && fullWidth && shouldRenderEndIcon && shouldRenderMainText;
  const shouldRenderFakeEndIcon =
    horizontalAlign === 'center' && fullWidth && shouldRenderStartIcon && shouldRenderMainText;

  const shouldRenderStartBox = shouldRenderStartIcon || shouldRenderFakeStartIcon;
  const shouldRenderCenterBox = shouldRenderMainText;
  const shouldRenderEndBox = shouldRenderEndIcon || shouldRenderFakeEndIcon;

  const startBox = shouldRenderStartBox ? (
    shouldRenderStartIcon ? (
      <div className={classes.startIcon}>{startIcon}</div>
    ) : shouldRenderFakeStartIcon ? (
      <FakeIcon />
    ) : null
  ) : null;

  const endBox = shouldRenderEndBox ? (
    <Box direction="row" shrink={0} verticalAlign="center">
      {shouldRenderEndIcon ? (
        <div className={classes.endIcon}>{endIcon}</div>
      ) : shouldRenderFakeEndIcon ? (
        <FakeIcon />
      ) : null}
    </Box>
  ) : null;

  const counterBox = counter ? <div className={classes.counterBox}>{counter}</div> : null;

  const mainText = shouldRenderMainText ? (
    <Text align={horizontalAlign} as="span" overflow={textOverflow} variant={mainTextSizes[size]}>
      {children}
    </Text>
  ) : null;

  const centerBox = shouldRenderCenterBox ? (
    <Box direction="row" horizontalAlign="center" verticalAlign="center" width="100%">
      <div className={classNames(classes.textBox, textAlignClasses[horizontalAlign])}>{mainText}</div>
    </Box>
  ) : null;

  const spinner = shouldRenderLoader ? (
    <div className={classes.spinner}>
      <Spinner color="neutral" size={spinnerSizes[size]} />
    </div>
  ) : null;

  const buttonContent = (
    <div
      className={classNames(classes.buttonContent, {
        [classes.loading]: shouldRenderLoader,
      })}
    >
      <Stack direction="row" horizontalAlign="space-between" spacing={gap} verticalAlign="center" grow>
        {startBox}
        {counterBox}
        {shouldRenderCenterBox && centerBox}
        {endBox}
      </Stack>
    </div>
  );

  const contentPadding = useMemo<Padding<P>>(() => {
    if (padding) {
      return padding;
    }

    if (children) {
      return `${contentBlockPadding[size]} ${contentInlinePadding[size]}`;
    }

    return size;
  }, [padding, children, size]);

  return (
    <button
      aria-label={ariaLabel}
      className={classNames(classes.host, hostVariantClasses[variant], hostColorClasses[color], {
        [classes.hostChecked]: checked,
        [classes.hostFocused]: focused,
        [classes.hostFullWidth]: fullWidth,
        [classes.hostNoWrap]: noWrap,
        [classes.hostRound]: round,
      })}
      data-test={dataTest}
      disabled={loading || disabled}
      ref={ref}
      style={style}
      type={type || 'button'}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerUp}
    >
      <Box
        direction="row"
        horizontalAlign={horizontalAlign}
        maxHeight="100%"
        maxWidth="100%"
        padding={contentPadding}
        verticalAlign="center"
        width={fullWidth ? '100%' : void 0}
      >
        {buttonContent}
        {spinner}
      </Box>
    </button>
  );
};

const Button = memo(forwardRef(ButtonInner)) as <P extends string>(
  _: ButtonProps<P> & { ref?: Ref<HTMLButtonElement> },
) => ReactElement;

ButtonInner.displayName = 'Button';

export type { ButtonProps };
export { Button };
