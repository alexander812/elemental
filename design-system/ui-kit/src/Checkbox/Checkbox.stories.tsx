import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './index';
import type { CheckboxProps } from './index';

const InteractiveCheckbox = (args: CheckboxProps) => {
  const [checked, setChecked] = useState(args.checked);

  return <Checkbox {...args} checked={checked} onChange={(value) => setChecked(value)} />;
};

const meta = {
  component: Checkbox,
  title: 'Inputs/Checkbox',
  args: {
    checked: false,
    label: 'Понедельник',
    subLabel: 'Русский',
  },
  render: (args) => <InteractiveCheckbox {...args} />,
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
