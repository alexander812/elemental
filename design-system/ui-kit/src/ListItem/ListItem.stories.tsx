import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconTasks } from '@elemental/icons';

import { Text } from '../Text';
import { ListItem } from './index';

const meta = {
  component: ListItem,
  title: 'Data Display/ListItem',
  args: {
    data: { id: '1' },
    padding: 'l',
    children: (
      <ListItem.StartBlock
        icon={<IconTasks fontSize={24} />}
        title={<Text variant="M / Medium">Дни недели</Text>}
        subtitle={<Text variant="XS / Medium">7 карточек</Text>}
      />
    ),
  },
} satisfies Meta<typeof ListItem>;

export default meta;

type Story = StoryObj<typeof ListItem>;

export const Default: Story = {};

export const WithEndBlock: Story = {
  args: {
    children: [
      <ListItem.StartBlock key="start" title={<Text variant="M / Medium">Дни недели</Text>} />,
      <ListItem.EndBlock
        key="end"
        content={<Text variant="M / Mono Num">2 · 5</Text>}
        subtitle={<Text variant="XS / Medium">выучено · не выучено</Text>}
      />,
    ],
  },
};

export const Selected: Story = {
  args: { selected: true },
};
