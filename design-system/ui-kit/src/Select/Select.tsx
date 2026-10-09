import type { CSSProperties } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import { BottomSheet } from '../BottomSheet';
import { useIcon } from '../IconsProvider';
import { parsePxToRem } from '../internal/utils';
import { Text } from '../Text';

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
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: SelectSize;
  value: string;
};

const hostSizes: Record<SelectSize, number> = {
  l: 56,
  m: 48,
  s: 32,
};

const Select = memo(
  ({ dataTest = 'Select', disabled, fullWidth, onChange, options, placeholder, size = 'm', value }: SelectProps) => {
    const [opened, setOpened] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);
    const arrowIcon = useIcon('arrowDown', { size: 16 });
    const checkIcon = useIcon('check', { size: 16 });

    const selected = options.find((option) => option.value === value);

    const controlStyle = useMemo<CSSProperties>(
      () => ({ height: parsePxToRem(`${hostSizes[size]}px`) }),
      [size],
    );

    useEffect(() => {
      if (!opened) return;

      listRef.current
        ?.querySelector<HTMLElement>('[data-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' });
    }, [opened]);

    const handleSelect = useCallback(
      (option: SelectOption) => {
        if (option.disabled) return;

        setOpened(false);
        onChange?.(option.value);
      },
      [onChange],
    );

    return (
      <div className={classNames(classes.host, { [classes.hostFullWidth]: fullWidth })} data-test={dataTest}>
        <button
          aria-expanded={opened}
          aria-haspopup="listbox"
          className={classes.control}
          disabled={disabled}
          style={controlStyle}
          type="button"
          onClick={() => setOpened(true)}
        >
          <Text
            as="span"
            color={selected ? void 0 : 'contrast-tertiary'}
            overflow="ellipsis"
            variant="M / Medium"
          >
            {selected?.label ?? placeholder ?? ''}
          </Text>
          <span className={classes.icon}>{arrowIcon}</span>
        </button>

        <BottomSheet opened={opened} onClosed={() => setOpened(false)}>
          <div className={classes.list} ref={listRef}>
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  className={classNames(classes.option, { [classes.optionSelected]: isSelected })}
                  data-selected={isSelected}
                  disabled={option.disabled}
                  type="button"
                  onClick={() => handleSelect(option)}
                >
                  <Text as="span" overflow="ellipsis" variant="M / Medium">
                    {option.label}
                  </Text>
                  {isSelected ? <span className={classes.optionIcon}>{checkIcon}</span> : null}
                </button>
              );
            })}
          </div>
        </BottomSheet>
      </div>
    );
  },
);

Select.displayName = 'Select';

export { Select };
export type { SelectOption, SelectProps, SelectSize };
