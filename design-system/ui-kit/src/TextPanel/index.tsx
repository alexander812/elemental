import { forwardRef } from 'react';
import type { ReactNode } from 'react';

import classNames from 'classnames';

import { Text } from '../Text';

import classes from './index.module.pcss';

type TextPanelProps = {
  children?: ReactNode;
  disabled?: boolean;
  grow?: boolean;
  onClick?: () => void;
  placeholder?: string;
  text?: string;
};

const TextPanel = forwardRef<HTMLDivElement, TextPanelProps>(
  ({ children, disabled, grow, onClick, placeholder, text }, ref) => {
    const hasText = typeof text === 'string' && text.trim().length > 0;

    return (
      <div
        className={classNames(classes.panel, {
          [classes.clickable]: !!onClick && !disabled,
          [classes.disabled]: disabled,
          [classes.grow]: grow,
        })}
        ref={ref}
        onClick={disabled ? void 0 : onClick}
      >
        {children ??
          (hasText ? (
            <div className={classes.clamp}>
              <Text variant="S / Medium">{text}</Text>
            </div>
          ) : placeholder ? (
            <Text color="contrast-tertiary" variant="S / Medium">
              {placeholder}
            </Text>
          ) : null)}
      </div>
    );
  },
);

TextPanel.displayName = 'TextPanel';

export { TextPanel };
export type { TextPanelProps };
