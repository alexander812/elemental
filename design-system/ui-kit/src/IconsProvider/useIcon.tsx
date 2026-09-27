import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useIconsMap } from './IconsContext';
import type { SupportedIcons } from './types';

export function useIcon(name: SupportedIcons, { size }: { size: number }): ReactElement | null {
  const icons = useIconsMap();

  return useMemo(() => {
    if (!icons) return null;

    const Icon = icons[name];

    if (!Icon) return null;

    return <Icon size={size} />;
  }, [icons, name, size]);
}
