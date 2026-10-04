import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './index';
import type { SwitchProps } from './index';

const InteractiveSwitch = (args: SwitchProps) => {
  const [checked, setChecked] = useState(args.checked);

  return <Switch {...args} checked={checked} onChange={(value) => setChecked(value)} />;
};

const meta = {
  component: Switch,
  title: 'Inputs/Switch',
  args: {
    checked: false,
    label: 'Переносить в выученные',
    subLabel: 'После успешной проверки',
  },
  render: (args) => <InteractiveSwitch {...args} />,
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof Switch>;

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
