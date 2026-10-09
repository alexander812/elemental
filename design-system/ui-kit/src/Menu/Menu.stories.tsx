import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconMoreHorizontal, IconTrash } from '@elemental/icons';

import { BottomSheetProvider } from '../BottomSheet';
import { ButtonIcon } from '../ButtonIcon';
import { Menu } from './index';

const meta = {
  component: Menu.Root,
  title: 'Navigation/Menu',
  parameters: { layout: 'padded' },
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <BottomSheetProvider>
        <Menu.Root open={open} onToggle={setOpen}>
          <Menu.Trigger>
            <ButtonIcon icon={<IconMoreHorizontal fontSize={24} />} variant="flat" />
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item icon={<IconTrash fontSize={16} />} label="Удалить все карточки" />
          </Menu.Content>
        </Menu.Root>
      </BottomSheetProvider>
    );
  },
} satisfies Meta<typeof Menu.Root>;

export default meta;

type Story = StoryObj<typeof Menu.Root>;

export const Default: Story = {};
