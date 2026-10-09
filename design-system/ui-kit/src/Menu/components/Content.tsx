import type { FC, PropsWithChildren } from 'react';
import { memo, useContext } from 'react';

import { BottomSheet } from '../../BottomSheet';
import { MenuContext } from '../contexts';

import classes from '../index.module.pcss';

type MenuContentProps = PropsWithChildren<{
  dataTest?: string;
}>;

const MenuContent: FC<MenuContentProps> = memo(({ children, dataTest = 'MenuContent' }) => {
  const menu = useContext(MenuContext);

  if (!menu) {
    return null;
  }

  return (
    <BottomSheet opened={menu.open} onClosed={menu.close}>
      <div className={classes.content} data-test={dataTest}>
        {children}
      </div>
    </BottomSheet>
  );
});

MenuContent.displayName = 'Menu.Content';

export { MenuContent };
export type { MenuContentProps };
