import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import classes from './index.module.pcss';

type BottomSheetContextValue = {
  host: HTMLElement | null;
};

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

const BottomSheetProvider: FC<PropsWithChildren> = ({ children }) => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  const providedValue = useMemo(() => ({ host }), [host]);

  return (
    <BottomSheetContext.Provider value={providedValue}>
      {children}
      <div className={classes.portalHost} ref={setHost} />
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheetContext = (): BottomSheetContextValue => {
  const context = useContext(BottomSheetContext);

  if (!context) {
    throw new Error('BottomSheetProvider is missing');
  }

  return context;
};

export { BottomSheetProvider };
