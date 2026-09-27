import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconPlusBig } from '@elemental/icons';

import { ButtonIcon } from './index';

const meta = {
  component: ButtonIcon,
  title: 'Controls/ButtonIcon',
  args: {
    icon: <IconPlusBig fontSize={16} />,
    ariaLabel: 'Add',
  },
} satisfies Meta<typeof ButtonIcon>;

export default meta;

type Story = StoryObj<typeof ButtonIcon>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Flat: Story = {
  args: { variant: 'flat', color: 'neutral' },
};

export const Round: Story = {
  args: { round: true, size: 'm' },
};
