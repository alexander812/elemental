import type { Meta, StoryObj } from '@storybook/react-vite';

import { Radio } from './index';

const meta = {
  component: Radio,
  title: 'Inputs/Radio',
  args: {
    name: 'theme',
    value: 'dark',
  },
  render: (args) => (
    <Radio {...args}>
      <Radio.Option label="Светлая" value="light" />
      <Radio.Option label="Тёмная" value="dark" />
    </Radio>
  ),
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof Radio>;

export const Default: Story = {};

export const WithSubLabel: Story = {
  render: (args) => (
    <Radio {...args}>
      <Radio.Option label="Светлая" subLabel="Светлая тема оформления" value="light" />
      <Radio.Option label="Тёмная" subLabel="Тёмная тема оформления" value="dark" />
    </Radio>
  ),
};
