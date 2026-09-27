import type { FC, PropsWithChildren } from 'react';
import { memo } from 'react';

import { Box } from '../../../Box';
import { Text } from '../../../Text';

type HeaderTextVariant = 'primary' | 'secondary';

type HeaderTextProps = {
  variant: HeaderTextVariant;
};
export const HeaderText: FC<PropsWithChildren<HeaderTextProps>> = memo(({ children, variant }) => {
  const isSecondary = variant === 'secondary';

  return (
    <Box width="100%">
      <Text
        align={variant === 'secondary' ? 'center' : 'start'}
        as="span"
        overflow="ellipsis"
        variant={isSecondary ? 'M / Medium' : 'XL / Medium'}
      >
        {children}
      </Text>
    </Box>
  );
});

export type { HeaderTextVariant };
