import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormHelperText } from './index';

const meta = {
  component: FormHelperText,
  title: 'Inputs/FormHelperText',
  args: {
    children: 'Введите перевод',
    variant: 'neutral',
  },
} satisfies Meta<typeof FormHelperText>;

export default meta;

type Story = StoryObj<typeof FormHelperText>;

export const Neutral: Story = {};

export const Error: Story = {
  args: { children: 'Неверный перевод', variant: 'error' },
};

export const Success: Story = {
  args: { children: 'Принятно!', variant: 'success' },
};

export const Warning: Story = {
  args: { children: 'Проверьте перевод', variant: 'warning' },
};

export const Rounded: Story = {
  args: { rounded: true },
};

export const RoundedError: Story = {
  args: { children: 'Неверный перевод', rounded: true, variant: 'error' },
};
