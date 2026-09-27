import type { CSSProperties, FC, ReactNode } from 'react';
import { memo } from 'react';

import { Box } from '../../Box';
import { Stack } from '../../Stack';

export type StartBlockProps = {
  icon?: ReactNode;
  subtitle?: ReactNode;
  swap?: boolean;
  title: ReactNode;
  verticalAlign?: CSSProperties['alignItems'];
};

export const StartBlock: FC<StartBlockProps> = memo(
  ({ icon, subtitle, swap = false, title, verticalAlign = 'center' }) => {
    return (
      <Stack direction="row" spacing="m" verticalAlign={verticalAlign} grow>
        {icon ? <Box shrink={0}>{icon}</Box> : null}
        <Stack direction={swap ? 'column-reverse' : 'column'} spacing="xxs" verticalAlign="center">
          {title}
          {subtitle}
        </Stack>
      </Stack>
    );
  },
);
