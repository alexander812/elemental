import type { FC, ReactNode } from 'react';
import { memo, useCallback, useContext } from 'react';

import { Text } from '../../Text';
import { MenuContext } from '../contexts';

import classes from '../index.module.pcss';

type MenuItemProps = {
  dataTest?: string;
  disabled?: boolean;
  icon?: ReactNode;
  label: ReactNode;
  onClick?: () => void;
  value?: string;
};

const MenuItem: FC<MenuItemProps> = memo(
  ({ dataTest = 'MenuItem', disabled = false, icon, label, onClick, value }) => {
    const menu = useContext(MenuContext);

    const handleClick = useCallback(() => {
      if (disabled) return;

      onClick?.();
      menu?.close();
    }, [disabled, onClick, menu]);

    if (!menu) return null;

    return (
      <button
        className={classes.item}
        data-test={dataTest}
        disabled={disabled}
        id={value ? `menu-item-${value}` : undefined}
        type="button"
        onClick={handleClick}
      >
        {icon && <div className={classes.itemIconStart}>{icon}</div>}
        <span className={classes.itemLabel}>
          <Text as="span" overflow="ellipsis" variant="M / Medium">
            {label}
          </Text>
        </span>
      </button>
    );
  },
);

MenuItem.displayName = 'MenuItem';

export { MenuItem };
