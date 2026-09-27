import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './index';

const options = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const InteractiveSelect = () => {
  const [value, setValue] = useState('ru');

  return (
    <Select
      fullWidth
      options={options}
      value={value}
      onChange={(next) => setValue(next)}
    />
  );
};

const meta = {
  component: Select,
  title: 'Inputs/Select',
  render: () => <InteractiveSelect />,
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Disabled: Story = {
  render: () => <Select disabled fullWidth options={options} value="ru" />,
};
