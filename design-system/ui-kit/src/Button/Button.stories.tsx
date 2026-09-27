import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconPlusBig } from '@elemental/icons';

import { Button } from './index';

const meta = {
  component: Button,
  title: 'Controls/Button',
  args: {
    children: 'Применить',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Accent: Story = {
  args: { variant: 'primary', color: 'accent' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Добавить новый' },
};

export const Flat: Story = {
  args: { variant: 'flat', color: 'neutral' },
};

export const Positive: Story = {
  args: { color: 'positive', children: 'Выучено' },
};

export const Negative: Story = {
  args: { color: 'negative', children: 'Удалить' },
};

export const WithIcon: Story = {
  args: { startIcon: <IconPlusBig fontSize={16} />, children: 'Добавить слово' },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};
