import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from './index';

const meta = {
  component: Textarea,
  title: 'Inputs/Textarea',
  args: {
    value: '',
    placeholder: 'Введите текст',
    fullWidth: true,
    rows: 5,
  },
  render: (args) => <Textarea {...args} />,
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const Filled: Story = {
  args: { value: 'У пожилых крестьян в небольшой деревне' },
};

export const Error: Story = {
  args: { error: 'Обязательное поле', value: '' },
};

export const HelperText: Story = {
  args: { helperText: 'Вставьте текст для разбора' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Monday' },
};
