import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconCheck, IconClose, IconPlusBig } from '@elemental/icons';

import { Chip } from './index';

const meta = {
  component: Chip,
  title: 'Controls/Chip',
  args: {
    label: 'Набор карточек',
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof Chip>;

export const Contained: Story = {};

export const Outlined: Story = {
  args: { variant: 'outlined' },
};

export const WithCounter: Story = {
  args: { counter: 7, label: 'Дни недели' },
};

export const WithIcons: Story = {
  args: {
    startIcon: <IconCheck fontSize={16} />,
    endIcon: <IconClose fontSize={16} />,
    counter: 3,
    label: 'Карточки',
  },
};

export const Primary: Story = {
  args: { color: 'primary', startIcon: <IconPlusBig fontSize={16} />, label: 'Добавить' },
};
