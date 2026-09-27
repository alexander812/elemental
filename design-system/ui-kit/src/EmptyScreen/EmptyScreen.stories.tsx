import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconTasks } from '@elemental/icons';

import { Button } from '../Button';
import { EmptyScreen } from './index';

const meta = {
  component: EmptyScreen,
  title: 'Layout/EmptyScreen',
  args: {
    icon: <IconTasks fontSize={24} />,
    text: 'Пока в наборе нет карточек',
    action: <Button>Добавить слово</Button>,
    fullHeight: true,
  },
} satisfies Meta<typeof EmptyScreen>;

export default meta;

type Story = StoryObj<typeof EmptyScreen>;

export const Default: Story = {};

export const WithoutAction: Story = {
  args: { action: undefined },
};
