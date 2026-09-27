import type { FC, PropsWithChildren } from 'react';
import { memo } from 'react';

import { IconsContext } from './IconsContext';
import type { SupportedIconsMap } from './types';

const IconsProvider: FC<PropsWithChildren<{ icons: SupportedIconsMap }>> = memo(
  ({ children, icons }) => {
    return <IconsContext.Provider value={icons}>{children}</IconsContext.Provider>;
  },
);

IconsProvider.displayName = 'IconsProvider';

export { IconsProvider };
export type { SupportedIcons, SupportedIconsMap } from './types';
export { useIcon } from './useIcon';
