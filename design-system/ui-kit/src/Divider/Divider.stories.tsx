import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './index';
import { Stack } from '../Stack';
import { Text } from '../Text';

const meta = {
  component: Divider,
  title: 'Layout/Divider',
  render: () => (
    <Stack spacing="m">
      <Text variant="M / Medium">Раздел</Text>
      <Divider />
      <Text variant="M / Medium">Другой раздел</Text>
    </Stack>
  ),
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {};
