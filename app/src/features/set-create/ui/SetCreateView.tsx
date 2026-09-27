import { useState } from 'react';
import type { FormEvent } from 'react';

import { useUnit } from 'effector-react';

import { Box, Button, Header, InputText, Stack } from '@elemental/ui-kit';

import { popScreen } from '../../navigation/store';
import { createSetFx } from '../../sets/store';

export function SetCreateView() {
  const [name, setName] = useState('');
  const pending = useUnit(createSetFx.pending);

  const canApply = name.trim().length > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canApply) return;

    await createSetFx(name);
    popScreen();
  };

  return (
    <Box grow height="100%">
      <Header back text="Новый набор" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <InputText
              autoFocus
              floatingLabel
              fullWidth
              placeholder="Название"
              size="m"
              value={name}
              onChange={(value) => setName(value)}
            />
            <Button disabled={!canApply} fullWidth loading={pending} type="submit">
              Применить
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
