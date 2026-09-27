import { forwardRef, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode, Ref } from 'react';

import classNames from 'classnames';

import { Box } from '../Box';
import { FormHelperText } from '../FormHelperText';
import { useIcon } from '../IconsProvider';
import type { Spacing } from '../internal/constants';
import { usePadding } from '../internal/hooks';
import type { ColorToken } from '../internal/types';
import typography from '../internal/typography/typography.module.pcss';
import { mapColor, parsePxToRem } from '../internal/utils';
import { Stack } from '../Stack';
import { Text } from '../Text';
import type { TextVariant } from '../Text';

import classes from './index.module.pcss';

type InputSize = 'l' | 'm' | 's';

type InputTextProps = {
  align?: CSSProperties['textAlign'];
  autoComplete?: string | undefined;
  autoFocus?: boolean | undefined;
  borderRadius?: Spacing;
  color?: ColorToken | undefined;
  dataTest?: string;
  disabled?: boolean | undefined;
  endIcon?: ReactNode;
  error?: ReactNode | boolean;
  floatingLabel?: boolean;
  fullWidth?: boolean;
  helperText?: ReactNode;
  inputMode?: 'decimal' | 'email' | 'none' | 'numeric' | 'search' | 'tel' | 'text' | 'url' | undefined;
  inputRef?: Ref<HTMLInputElement>;
  name?: string | undefined;
  onBlur?: () => void;
  onClear?: (() => void) | undefined;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: ReactNode;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  size?: InputSize | number;
  startIcon?: ReactNode;
  type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url' | undefined;
  value: string | null;
  variant?: TextVariant | undefined;
};

const DEFAULT_VARIANT: TextVariant = 'S Compact / Mono Num';

const hostSizes: Record<InputSize, number> = {
  l: 56,
  m: 48,
  s: 32,
};

const InputText = memo(
  forwardRef<HTMLDivElement, InputTextProps>(
    (
      {
        align,
        autoComplete,
        autoFocus,
        borderRadius = 's',
        color,
        dataTest = 'InputText',
        disabled,
        endIcon,
        error,
        floatingLabel,
        fullWidth,
        helperText,
        inputMode,
        inputRef,
        name,
        onBlur,
        onChange,
        onClear,
        placeholder,
        readOnly,
        required,
        size = 's',
        startIcon,
        type = 'text',
        value,
        variant = DEFAULT_VARIANT,
      },
      ref,
    ) => {
      const iconClose = useIcon('close', {
        size: 16,
      });

      const calculatedRadius = usePadding(borderRadius);

      const hostStyle = useMemo<CSSProperties>(() => {
        return {
          borderRadius: calculatedRadius,
        };
      }, [calculatedRadius]);

      const wrapperStyle = useMemo<CSSProperties>(() => {
        return {
          minHeight: parsePxToRem(typeof size === 'number' ? `${size}px` : `${hostSizes[size]}px`),
        };
      }, [size]);

      const empty = !value;

      const hasError = !!error;
      const hasErrorMessage = hasError && typeof error !== 'boolean';

      const [variantSize, variantStyle] = variant.split(' / ');
      const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
          if (disabled) return;
          onChange?.(event.target.value, event);
        },
        [onChange, disabled],
      );

      endIcon = onClear ? (
        <Stack direction="row" shrink={0} spacing="xs" verticalAlign="center">
          <div
            className={classNames(classes.clearIcon, !empty && classes.clearIconVisible)}
            role="button"
            onClick={onClear}
          >
            {iconClose}
          </div>
          {endIcon}
        </Stack>
      ) : (
        endIcon
      );

      const localInputRef = useRef<HTMLInputElement>(null);

      const setRefs = useCallback(
        (el: HTMLInputElement | null) => {
          localInputRef.current = el;

          if (typeof inputRef === 'function') {
            inputRef(el);
          } else if (inputRef) {
            inputRef.current = el;
          }
        },
        [inputRef],
      );

      const style = useMemo((): CSSProperties | undefined => {
        const result: CSSProperties = {};

        if (align) result.textAlign = align;

        if (color && !disabled) result.color = mapColor(color);

        return Object.keys(result).length ? result : undefined;
      }, [align, color, disabled]);

      useEffect(() => {
        if (autoFocus) {
          localInputRef.current?.focus({ preventScroll: true });
        }
      }, [autoFocus]);

      return (
        <Box
          dataTest={dataTest}
          direction="column"
          maxHeight="100%"
          maxWidth="100%"
          ref={ref}
          shrink={fullWidth ? void 0 : 0}
          width={fullWidth ? '100%' : 'fit-content'}
        >
          <Stack spacing="s" grow>
            <label
              className={classNames(classes.host, {
                [classes.hostDisabled]: disabled,
                [classes.hostEmpty]: empty,
                [classes.hostError]: hasError,
                [classes.hostFullWidth]: fullWidth,
                [classes.hostWithFloatingLabel]: floatingLabel,
              })}
              htmlFor={name}
              style={hostStyle}
            >
              <div className={classes.wrapper} style={wrapperStyle}>
                {startIcon ? <span className={classes.icon}>{startIcon}</span> : null}
                <div className={classes.input}>
                  {floatingLabel || (placeholder && !value) ? (
                    <span
                      className={floatingLabel ? classes.floatingLabel : classes.placeholder}
                      data-test="Placeholder"
                    >
                      <Text as="span" variant={variant}>
                        {placeholder}
                      </Text>
                    </span>
                  ) : null}

                  <input
                    autoComplete={autoComplete}
                    className={classNames(classes.nativeInput, typography.typography)}
                    data-size={variantSize}
                    data-style={variantStyle}
                    data-test="Input"
                    disabled={disabled}
                    inputMode={inputMode}
                    name={name}
                    readOnly={readOnly}
                    ref={setRefs}
                    required={required}
                    style={style}
                    type={type}
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChange={handleChange}
                  />
                </div>
                {endIcon ? <span className={classes.icon}>{endIcon}</span> : null}
              </div>
            </label>
            {hasErrorMessage && !helperText ? (
              <FormHelperText dataTest="Error" variant="error">
                {error}
              </FormHelperText>
            ) : null}
            {!hasErrorMessage && helperText ? (
              <FormHelperText dataTest="HelperText">{helperText}</FormHelperText>
            ) : null}
          </Stack>
        </Box>
      );
    },
  ),
);

InputText.displayName = 'InputText';

export type { InputTextProps };
export { InputText };
