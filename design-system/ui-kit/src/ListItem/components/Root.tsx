import { forwardRef, useCallback, useMemo } from 'react';
import type { CSSProperties, ForwardedRef, ReactElement } from 'react';

import classNames from 'classnames';

import { Box } from '../../Box';
import { usePadding } from '../../internal/hooks';
import type { Padding } from '../../internal/types';
import { Stack } from '../../Stack';

import type { EndBlock, EndBlockProps } from './EndBlock';
import type { StartBlock, StartBlockProps } from './StartBlock';

import classes from './index.module.pcss';

type StartBlockType = ReactElement<StartBlockProps, typeof StartBlock>;
type EndBlockType = ReactElement<EndBlockProps, typeof EndBlock>;

type ListItemProps<T, P extends string> = {
  borderRadius?: Padding<P>;
  children: (EndBlockType | StartBlockType | null)[] | EndBlockType | StartBlockType;
  data: T;
  dataTest?: string;
  disabled?: boolean;
  onClick?: ((data: T) => unknown) | undefined;
  padding?: Padding<P>;
  selected?: boolean;
};

const ListItemRootImpl = <T extends unknown, P extends string>(
  { borderRadius = '0', children, data, dataTest, disabled, onClick, padding = 'l', selected }: ListItemProps<T, P>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement => {
  const calculatedRadius = usePadding(borderRadius);

  const style = useMemo<CSSProperties>(
    () => ({
      borderRadius: calculatedRadius,
    }),
    [calculatedRadius],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;

    onClick?.(data);
  }, [data, disabled, onClick]);

  return (
    <div
      className={classNames(
        classes.host,
        onClick && !disabled && classes.hostClickable,
        selected && classes.hostSelected,
        disabled && classes.hostDisabled,
      )}
      data-test={dataTest}
      ref={ref}
      role="button"
      style={style}
      tabIndex={0}
      onClick={handleClick}
    >
      <Box padding={padding} width="100%">
        <Stack direction="row" spacing="m" grow>
          {children}
        </Stack>
      </Box>
    </div>
  );
};

export const ListItemRoot = forwardRef(ListItemRootImpl) as <T, P extends string>(
  props: ListItemProps<T, P> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement;
