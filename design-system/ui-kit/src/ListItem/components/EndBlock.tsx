import type { FC, ReactNode } from 'react';
import { memo } from 'react';

import { Stack } from '../../Stack';

export type EndBlockProps = {
  content: ReactNode;
  subtitle?: ReactNode;
};

export const EndBlock: FC<EndBlockProps> = memo(({ content, subtitle }) => {
  return (
    <Stack horizontalAlign="end" shrink={0} verticalAlign="center">
      {subtitle}
      {content}
    </Stack>
  );
});
