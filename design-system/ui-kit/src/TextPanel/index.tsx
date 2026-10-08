import { forwardRef } from 'react';
import type { ReactNode } from 'react';

import classNames from 'classnames';

import { Card } from '../Card';
import { Text } from '../Text';

import classes from './index.module.pcss';

type TextPanelProps = {
  children?: ReactNode;
  grow?: boolean;
  onClick?: () => void;
  placeholder?: string;
  text?: string;
};

const TextPanel = forwardRef<HTMLDivElement, TextPanelProps>(
  ({ children, grow, onClick, placeholder, text }, ref) => {
    const hasText = typeof text === 'string' && text.trim().length > 0;

    return (
      <div className={classNames(classes.wrapper, { [classes.wrapperGrow]: grow })}>
        <Card
          borderColor="contrast-primary"
          color="transparent"
          fitContainer={grow}
          height={grow ? '100%' : void 0}
          ref={ref}
          onClick={onClick}
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
        </Card>
      </div>
    );
  },
);

TextPanel.displayName = 'TextPanel';

export { TextPanel };
export type { TextPanelProps };
