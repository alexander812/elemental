import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stack } from './index';
import { Card } from '../Card';

const meta = {
  component: Stack,
  title: 'Layout/Stack',
  render: (args) => (
    <Stack {...args}>
      <Card>Один</Card>
      <Card>Два</Card>
      <Card>Три</Card>
    </Stack>
  ),
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof Stack>;

export const Column: Story = {};

export const Row: Story = {
  args: { direction: 'row' },
};

export const WithSpacing: Story = {
  args: { spacing: 'm' },
};

export const Wrap: Story = {
  args: { direction: 'row', wrap: 'wrap', spacing: 's' },
};
