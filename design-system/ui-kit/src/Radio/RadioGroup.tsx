import type { ChangeEvent, FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useMemo } from 'react';

type RadioValue = string;

type RadioGroupProps = PropsWithChildren<{
  disabled?: boolean;
  name: string;
  onChange?(value: RadioValue, event: ChangeEvent<HTMLInputElement>): void;
  required?: boolean;
  value: RadioValue;
}>;

type ContextType = {
  disabled?: boolean | undefined;
  name: string;
  onChange(value: RadioValue, event: ChangeEvent<HTMLInputElement>): void;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  value: RadioValue;
};

const RadioGroupContext = createContext<ContextType | null>(null);

const RadioGroup: FC<RadioGroupProps> = ({ children, disabled, name, onChange, required, value }) => {
  const handleChange = useCallback(
    (value: RadioValue, event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(value, event);
    },
    [onChange],
  );

  const providerValue = useMemo(
    () => ({
      disabled,
      name,
      onChange: handleChange,
      readOnly: !onChange,
      required,
      value,
    }),
    [disabled, name, onChange, required, value, handleChange],
  );

  return <RadioGroupContext.Provider value={providerValue}>{children}</RadioGroupContext.Provider>;
};

RadioGroup.displayName = 'Radio';

export { RadioGroup, RadioGroupContext };
