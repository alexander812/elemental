import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from './index';

const meta = {
  component: Text,
  title: 'Typography/Text',
  args: {
    children: 'Дни недели',
    variant: 'M / Medium',
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof Text>;

export const XL: Story = {
  args: { variant: 'XL / Medium' },
};

export const L: Story = {
  args: { variant: 'L / Medium' },
};

export const M: Story = {
  args: { variant: 'M / Medium' },
};

export const S: Story = {
  args: { variant: 'S / Medium' },
};

export const XS: Story = {
  args: { variant: 'XS / Medium' },
};

export const Caps: Story = {
  args: { variant: 'XS / CAPS' },
};

export const MonoNum: Story = {
  args: { variant: 'M / Mono Num', children: '42' },
};

export const Colored: Story = {
  args: { variant: 'M / Medium', color: 'accent-text-and-icons' },
};
