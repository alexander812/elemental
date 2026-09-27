import { createContext } from 'react';

type MenuContextProps = {
  close(): void;
  open: boolean;
  toggle(): void;
};

export const MenuContext = createContext<MenuContextProps | null>(null);
