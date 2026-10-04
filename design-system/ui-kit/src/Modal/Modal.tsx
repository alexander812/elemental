import type { PropsWithChildren } from 'react';
import { memo, useEffect } from 'react';

import { createPortal } from 'react-dom';

import { Card } from '../Card';

import classes from './Modal.module.pcss';

type ModalProps = PropsWithChildren<{
  dataTest?: string;
  onClose?: () => void;
  open: boolean;
}>;

const Modal = memo(
  ({ children, dataTest = 'Modal', onClose, open }: ModalProps) => {
    useEffect(() => {
      if (!open || !onClose) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, open]);

    if (!open) return null;

    return createPortal(
      <div className={classes.overlay} data-test={dataTest} onClick={onClose}>
        <div className={classes.content} onClick={(event) => event.stopPropagation()}>
          <Card color="surfaceElevation1" padding="l" width="100%">
            {children}
          </Card>
        </div>
      </div>,
      document.body,
    );
  },
);

Modal.displayName = 'Modal';

export { Modal };
export type { ModalProps };
