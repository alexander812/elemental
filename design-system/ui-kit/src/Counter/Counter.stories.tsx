import type { Meta, StoryObj } from '@storybook/react-vite';

import { Counter } from './index';

const meta = {
  component: Counter,
  title: 'Data Display/Counter',
  args: {
    count: 7,
  },
} satisfies Meta<typeof Counter>;

export default meta;

type Story = StoryObj<typeof Counter>;

export const Accent: Story = {};

export const Positive: Story = {
  args: { color: 'positive' },
};

export const Negative: Story = {
  args: { color: 'negative' },
};

export const Warning: Story = {
  args: { color: 'warning' },
};

export const Maxed: Story = {
  args: { count: 120, max: 99 },
};
