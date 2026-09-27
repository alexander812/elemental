import type { ReactNode } from 'react';
import { forwardRef } from 'react';

import classNames from 'classnames';

import type { ColorToken } from '../internal/types';
import { Stack } from '../Stack';
import { Text } from '../Text';

import classes from './index.module.pcss';

type EmptyScreenProps = {
  action?: ReactNode;
  fullHeight?: boolean;
  icon: ReactNode;
  noBorder?: boolean;
  text: ReactNode;
  textColor?: ColorToken;
};

const EmptyScreen = forwardRef<HTMLDivElement, EmptyScreenProps>(
  ({ action, fullHeight, icon, noBorder, text, textColor }: EmptyScreenProps, ref) => {
    return (
      <Stack
        height={fullHeight ? '100%' : void 0}
        horizontalAlign="center"
        ref={ref}
        spacing="l"
        verticalAlign="center"
      >
        <div className={classNames(classes.iconContainer, noBorder ? classes.noBorder : '')}>{icon}</div>
        <Text align="center" color={textColor ?? 'contrast-tertiary'} variant="S / Medium">
          {text}
        </Text>
        {action}
      </Stack>
    );
  },
);

EmptyScreen.displayName = 'EmptyScreen(ui-kit)';

export { EmptyScreen };
