import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './index';
import { Stack } from '../Stack';
import { Text } from '../Text';

const meta = {
  component: Card,
  title: 'Layout/Card',
  args: {
    padding: 'l',
    children: <Text variant="M / Medium">Дни недели</Text>,
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof Card>;

export const Primary: Story = {};

export const Control: Story = {
  args: { color: 'control' },
};

export const Accent: Story = {
  args: { color: 'accent' },
};

export const SurfaceElevation1: Story = {
  args: { color: 'surfaceElevation1' },
};

export const Elevated: Story = {
  args: { elevated: true },
};

export const Clickable: Story = {
  args: { onClick: () => undefined },
};

export const Group: Story = {
  render: (args) => (
    <Stack spacing="s">
      <Card {...args}>Первый набор</Card>
      <Card {...args}>Второй набор</Card>
      <Card {...args}>Третий набор</Card>
    </Stack>
  ),
};
