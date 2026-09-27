import type { ChangeEvent, CSSProperties } from 'react';
import { forwardRef, memo, useCallback, useMemo } from 'react';

import classNames from 'classnames';

import { useIcon } from '../IconsProvider';
import { parsePxToRem } from '../internal/utils';

import classes from './Select.module.pcss';

type SelectSize = 'l' | 'm' | 's';

type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type SelectProps = {
  dataTest?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  name?: string;
  onChange?: (value: string, event: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  size?: SelectSize;
  value: string;
};

const hostSizes: Record<SelectSize, number> = {
  l: 56,
  m: 48,
  s: 32,
};

const Select = memo(
  forwardRef<HTMLDivElement, SelectProps>(
    ({ dataTest = 'Select', disabled, fullWidth, name, onChange, options, size = 'm', value }, ref) => {
      const arrowIcon = useIcon('arrowDown', { size: 16 });

      const selectStyle = useMemo<CSSProperties>(
        () => ({ height: parsePxToRem(`${hostSizes[size]}px`) }),
        [size],
      );

      const handleChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
          onChange?.(event.target.value, event);
        },
        [onChange],
      );

      return (
        <div
          className={classNames(classes.host, { [classes.hostFullWidth]: fullWidth })}
          data-test={dataTest}
          ref={ref}
        >
          <select
            className={classes.select}
            disabled={disabled}
            name={name}
            style={selectStyle}
            value={value}
            onChange={handleChange}
          >
            {options.map((option) => (
              <option key={option.value} disabled={option.disabled} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={classes.icon}>{arrowIcon}</span>
        </div>
      );
    },
  ),
);

Select.displayName = 'Select';

export { Select };
export type { SelectOption, SelectProps, SelectSize };
