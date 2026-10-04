import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { Stack } from '../Stack';
import { Text } from '../Text';

import { Modal } from './index';

const InteractiveModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Открыть</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Stack spacing="m" horizontalAlign="center">
          <Text align="center" variant="S / Medium">
            Вы уверены, что хотите сбросить этот набор к первоначальному состоянию?
          </Text>
          <Button fullWidth onClick={() => setOpen(false)}>
            Да
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setOpen(false)}>
            Отмена
          </Button>
        </Stack>
      </Modal>
    </>
  );
};

const meta = {
  component: Modal,
  title: 'Overlays/Modal',
  render: () => <InteractiveModal />,
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {};
