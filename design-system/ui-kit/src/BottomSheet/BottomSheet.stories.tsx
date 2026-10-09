import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Box } from '../Box';
import { Button } from '../Button';
import { Stack } from '../Stack';
import { Text } from '../Text';

import { BottomSheet, BottomSheetProvider } from './index';

const InteractiveBottomSheet = () => {
  const [opened, setOpened] = useState(false);

  return (
    <BottomSheetProvider>
      <Button onClick={() => setOpened(true)}>Открыть</Button>
      <BottomSheet opened={opened} onClosed={() => setOpened(false)}>
        <Box padding="l">
          <Stack horizontalAlign="center" spacing="m">
            <Text align="center" variant="S / Medium">
              Bottom sheet выезжает снизу поверх остальных элементов и закрывается свайпом или тапом
              по затемнению.
            </Text>
            <Button fullWidth onClick={() => setOpened(false)}>
              Хорошо
            </Button>
          </Stack>
        </Box>
      </BottomSheet>
    </BottomSheetProvider>
  );
};

const meta = {
  component: BottomSheet,
  title: 'Overlays/BottomSheet',
  render: () => <InteractiveBottomSheet />,
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof BottomSheet>;

export const Default: Story = {};
