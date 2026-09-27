import type { Meta, StoryObj } from '@storybook/react-vite';

import { Box } from './index';
import { Card } from '../Card';

const meta = {
  component: Box,
  title: 'Layout/Box',
  render: (args) => (
    <Box {...args}>
      <Card>Один</Card>
      <Card>Два</Card>
    </Box>
  ),
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof Box>;

export const Column: Story = {};

export const Row: Story = {
  args: { direction: 'row' },
};

export const WithPadding: Story = {
  args: { padding: 'l' },
};

export const WithGaps: Story = {
  args: { direction: 'row' },
};
