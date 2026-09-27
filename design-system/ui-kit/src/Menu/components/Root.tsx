import type { FC, PropsWithChildren } from 'react';
import { useCallback, useMemo, useRef } from 'react';

import { useOutsideClick } from '../../internal/hooks';

import { MenuContext } from '../contexts';

import classes from '../index.module.pcss';

type MenuRootProps = PropsWithChildren<{
  onToggle?: (open: boolean) => void;
  open: boolean;
}>;

const MenuRoot: FC<MenuRootProps> = ({ children, onToggle, open }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useOutsideClick({
    enabled: open,
    handler: () => onToggle?.(false),
    ref: rootRef,
  });

  const toggle = useCallback(() => {
    onToggle?.(!open);
  }, [onToggle, open]);

  const close = useCallback(() => {
    onToggle?.(false);
  }, [onToggle]);

  const providerValue = useMemo(() => ({ close, open, toggle }), [close, open, toggle]);

  return (
    <div className={classes.root} ref={rootRef}>
      <MenuContext.Provider value={providerValue}>{children}</MenuContext.Provider>
    </div>
  );
};

MenuRoot.displayName = 'Menu.Root';

export { MenuRoot };
