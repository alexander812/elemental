import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressBar } from './index';

const meta = {
  component: ProgressBar,
  title: 'Feedback/ProgressBar',
  args: {
    value: 0.42,
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {};

export const Empty: Story = {
  args: { value: 0 },
};

export const Full: Story = {
  args: { value: 1 },
};
