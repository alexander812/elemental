import type { Meta, StoryObj } from '@storybook/react-vite';

import { InputText } from './index';

const meta = {
  component: InputText,
  title: 'Inputs/InputText',
  args: {
    value: '',
    placeholder: 'Название',
    fullWidth: true,
    size: 'm',
  },
  render: (args) => <InputText {...args} />,
} satisfies Meta<typeof InputText>;

export default meta;

type Story = StoryObj<typeof InputText>;

export const Default: Story = {};

export const Filled: Story = {
  args: { value: 'Дни недели' },
};

export const FloatingLabel: Story = {
  args: { floatingLabel: true, placeholder: 'Оригинал' },
};

export const Error: Story = {
  args: { error: 'Обязательное поле', value: '' },
};

export const HelperText: Story = {
  args: { helperText: 'На иностранном языке' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Monday' },
};
