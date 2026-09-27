import type { ChangeEventHandler, ReactNode } from 'react';
import { forwardRef, memo, useCallback, useContext } from 'react';

import classNames from 'classnames';

import { Text } from '../Text';

import { RadioGroupContext } from './RadioGroup';

import classes from './RadioOption.module.pcss';

type RadioOptionProps = {
  dataTest?: string;
  label?: ReactNode;
  size?: 'm' | 's';
  subLabel?: ReactNode;
  value: string;
};

const RadioOption = memo(
  forwardRef<HTMLDivElement, RadioOptionProps>(({ dataTest = 'Radio', label, size = 'm', subLabel, value }, ref) => {
    const radio = useContext(RadioGroupContext);
    const checked = radio?.value === value;

    const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
      (event) => {
        radio?.onChange(event.target.value, event);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [radio?.onChange, value],
    );

    const textComponent = label ? (
      <div className={classes.labelContainer}>
        {label && (
          <Text
            as="span"
            color={radio?.disabled ? 'contrast-tertiary' : 'contrast-primary'}
            variant={size === 'm' ? 'M / Medium' : 'S / Medium'}
          >
            {label}
          </Text>
        )}
        {subLabel && (
          <Text
            as="span"
            color={radio?.disabled ? 'contrast-tertiary' : 'contrast-secondary'}
            variant={size === 'm' ? 'S / Medium' : 'XS / Medium'}
          >
            {subLabel}
          </Text>
        )}
      </div>
    ) : null;

    return (
      <div className={classes.host} data-test={dataTest} ref={ref}>
        <label
          className={classNames(classes.itemContent, {
            [classes.itemContentDisabled]: radio?.disabled,
          })}
        >
          <input
            checked={checked}
            className={classes.itemNativeInput}
            disabled={radio?.disabled}
            name={radio?.name}
            readOnly={radio?.readOnly}
            required={radio?.required}
            type="radio"
            value={value}
            onChange={handleChange}
          />
          <div className={classes.itemFakeInput} />
          {textComponent ? textComponent : null}
        </label>
      </div>
    );
  }),
);

RadioOption.displayName = 'RadioOption';

export { RadioOption };
