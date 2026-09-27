import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from './index';

const meta = {
  component: Spinner,
  title: 'Feedback/Spinner',
  args: {
    size: 'm',
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Medium: Story = {};

export const Small: Story = {
  args: { size: 's' },
};

export const Large: Story = {
  args: { size: 'l' },
};

export const Neutral: Story = {
  args: { color: 'neutral' },
};
