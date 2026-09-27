import type { FC, PropsWithChildren } from 'react';
import { memo, useContext } from 'react';

import { MenuContext } from '../contexts';

import classes from '../index.module.pcss';

type MenuContentProps = PropsWithChildren<{
  dataTest?: string;
}>;

const MenuContent: FC<MenuContentProps> = memo(({ children, dataTest = 'MenuContent' }) => {
  const menu = useContext(MenuContext);

  if (!menu || !menu.open) {
    return null;
  }

  return (
    <div className={classes.content} data-test={dataTest} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
});

MenuContent.displayName = 'Menu.Content';

export { MenuContent };
export type { MenuContentProps };
