import type { FC, PropsWithChildren, MouseEventHandler } from 'react';
import { memo, useCallback, useContext } from 'react';

import { MenuContext } from '../contexts';

const MenuTrigger: FC<PropsWithChildren> = memo(({ children }) => {
  const menu = useContext(MenuContext);

  const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      event.stopPropagation();
      menu?.toggle();
    },
    [menu],
  );

  if (!menu) return null;

  return <div onClick={handleClick}>{children}</div>;
});

MenuTrigger.displayName = 'Menu.Trigger';

export { MenuTrigger };
