import type { ForwardedRef, ReactElement, ReactNode, Ref } from 'react';
import { forwardRef, memo } from 'react';

import { Button } from '../Button';
import type { ButtonProps } from '../Button';

const defaultHandler = (): null => null;

type ButtonIconProps<P extends string> = Partial<
  Pick<
    ButtonProps<P>,
    | 'ariaLabel'
    | 'borderRadius'
    | 'checked'
    | 'color'
    | 'counter'
    | 'dataTest'
    | 'disabled'
    | 'loading'
    | 'onClick'
    | 'onPointerDown'
    | 'onPointerLeave'
    | 'onPointerUp'
    | 'padding'
    | 'round'
    | 'size'
    | 'variant'
  >
> & {
  icon: ReactNode;
};

/**
 * The button icon meaning is only represented with an icon.
 * @example
 * ```tsx
 * <ButtonIcon icon={<IconStart />} />
 * ```
 */
const ButtonIconInner = <P extends string>(
  { dataTest = 'ButtonIcon', icon, onClick, ...bypassedProps }: ButtonIconProps<P>,
  ref: ForwardedRef<HTMLButtonElement>,
) => (
  <Button
    dataTest={dataTest}
    ref={ref}
    startIcon={icon}
    {...bypassedProps}
    type="button"
    onClick={onClick || defaultHandler}
  />
);

const ButtonIcon = memo(forwardRef(ButtonIconInner)) as <P extends string>(
  _: ButtonIconProps<P> & { ref?: Ref<HTMLButtonElement> },
) => ReactElement;

ButtonIconInner.displayName = 'ButtonIcon';

export { ButtonIcon };
