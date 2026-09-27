import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconMoreHorizontal } from '@elemental/icons';

import { ButtonIcon } from '../ButtonIcon';
import { Header } from './index';

const meta = {
  component: Header,
  title: 'Navigation/Header',
  args: {
    text: 'Elemental lang',
  },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof Header>;

export const Primary: Story = {};

export const WithBack: Story = {
  args: {
    back: true,
    text: 'Новый набор',
  },
};

export const WithToolbar: Story = {
  args: {
    endToolbar: <ButtonIcon icon={<IconMoreHorizontal fontSize={24} />} variant="flat" />,
  },
};
