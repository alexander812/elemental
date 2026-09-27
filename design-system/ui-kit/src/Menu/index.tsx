import type { MenuContentProps } from './components/Content';
import { MenuContent } from './components/Content';
import { MenuItem } from './components/Item';
import { MenuRoot } from './components/Root';
import { MenuTrigger } from './components/Trigger';

type MenuApi = typeof MenuRoot & {
  Content: typeof MenuContent;
  Item: typeof MenuItem;
  Root: typeof MenuRoot;
  Trigger: typeof MenuTrigger;
};

const Menu = MenuRoot as MenuApi;
Menu.Content = MenuContent;
Menu.Item = MenuItem;
Menu.Root = MenuRoot;
Menu.Trigger = MenuTrigger;

export type { MenuContentProps };
export { Menu };
