import { memo, useCallback, useMemo } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';

import classNames from 'classnames';

import { Box } from '../Box';
import { FormHelperText } from '../FormHelperText';
import { usePadding } from '../internal/hooks';
import typography from '../internal/typography/typography.module.pcss';
import { Stack } from '../Stack';
import type { TextVariant } from '../Text';

import classes from './index.module.pcss';

type TextareaProps = {
  dataTest?: string;
  disabled?: boolean | undefined;
  error?: ReactNode | boolean;
  fullWidth?: boolean;
  helperText?: ReactNode;
  name?: string | undefined;
  onBlur?: () => void;
  onChange?: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  readOnly?: boolean | undefined;
  rows?: number;
  value: string | null;
  variant?: TextVariant | undefined;
};

const DEFAULT_VARIANT: TextVariant = 'S Compact / Mono Num';

const Textarea = memo(
  ({
    dataTest = 'Textarea',
    disabled,
    error,
    fullWidth,
    helperText,
    name,
    onBlur,
    onChange,
    placeholder,
    readOnly,
    rows = 5,
    value,
    variant = DEFAULT_VARIANT,
  }: TextareaProps) => {
    const calculatedRadius = usePadding('s');

    const hasError = !!error;
    const hasErrorMessage = hasError && typeof error !== 'boolean';

    const hostStyle = useMemo<CSSProperties>(
      () => ({
        borderRadius: calculatedRadius,
      }),
      [calculatedRadius],
    );

    const [variantSize, variantStyle] = variant.split(' / ');

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        if (disabled) return;
        onChange?.(event.target.value, event);
      },
      [onChange, disabled],
    );

    return (
      <Box
        dataTest={dataTest}
        direction="column"
        maxHeight="100%"
        maxWidth="100%"
        shrink={fullWidth ? void 0 : 0}
        width={fullWidth ? '100%' : 'fit-content'}
      >
        <Stack spacing="s" grow>
          <label
            className={classNames(classes.host, {
              [classes.hostDisabled]: disabled,
              [classes.hostError]: hasError,
              [classes.hostFullWidth]: fullWidth,
            })}
            htmlFor={name}
            style={hostStyle}
          >
            <textarea
              className={classNames(classes.nativeTextarea, typography.typography)}
              data-size={variantSize}
              data-style={variantStyle}
              data-test="TextareaInput"
              disabled={disabled}
              name={name}
              placeholder={placeholder}
              readOnly={readOnly}
              rows={rows}
              value={value ?? ''}
              onBlur={onBlur}
              onChange={handleChange}
            />
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
);

Textarea.displayName = 'Textarea';

export type { TextareaProps };
export { Textarea };
