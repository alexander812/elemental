import type { ChangeEvent, ChangeEventHandler, ReactNode } from 'react';
import { forwardRef, memo, useCallback } from 'react';

import classNames from 'classnames';

import { Text } from '../Text';

import classes from './Checkbox.module.pcss';

type CheckboxProps = {
  checked: boolean;
  dataTest?: string;
  disabled?: boolean;
  label?: ReactNode;
  name?: string;
  onChange?(checked: boolean, event: ChangeEvent<HTMLInputElement>): void;
  subLabel?: ReactNode;
};

const Checkbox = memo(
  forwardRef<HTMLDivElement, CheckboxProps>(
    ({ checked, dataTest = 'Checkbox', disabled, label, name, onChange, subLabel }, ref) => {
      const readOnly = !onChange;

      const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
        (event) => {
          onChange?.(event.target.checked, event);
        },
        [onChange],
      );

      const textComponent = label ? (
        <div className={classes.labelContainer}>
          {label && (
            <Text as="span" color={disabled ? 'contrast-tertiary' : 'contrast-primary'} variant="M / Medium">
              {label}
            </Text>
          )}
          {subLabel && (
            <Text as="span" color={disabled ? 'contrast-tertiary' : 'contrast-secondary'} variant="S / Medium">
              {subLabel}
            </Text>
          )}
        </div>
      ) : null;

      return (
        <div className={classes.host} data-test={dataTest} ref={ref}>
          <label
            className={classNames(classes.itemContent, {
              [classes.itemContentDisabled]: disabled,
            })}
          >
            <input
              checked={checked}
              className={classes.itemNativeInput}
              disabled={disabled}
              name={name}
              readOnly={readOnly}
              type="checkbox"
              onChange={handleChange}
            />
            <div className={classes.itemFakeInput} />
            {textComponent ? textComponent : null}
          </label>
        </div>
      );
    },
  ),
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export type { CheckboxProps };
