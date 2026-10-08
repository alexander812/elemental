import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextPanel } from './index';

const meta = {
  component: TextPanel,
  title: 'Layout/TextPanel',
  args: {
    text: 'Понедельник вторник среда четверг пятница суббота воскресенье',
    onClick: () => undefined,
  },
} satisfies Meta<typeof TextPanel>;

export default meta;

type Story = StoryObj<typeof TextPanel>;

export const WithText: Story = {};

export const Empty: Story = {
  args: { text: '', placeholder: 'Текст ещё не заполнен' },
};
