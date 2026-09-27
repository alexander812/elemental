import { useState } from 'react';
import type { FormEvent } from 'react';

import { useUnit } from 'effector-react';

import { Box, Button, Header, InputText, Stack } from '@elemental/ui-kit';

import { getLanguageName } from '../../../lib/languages';
import { popScreen } from '../../navigation/store';
import { addCardFx } from '../../sets/store';
import { $originalLang, $translationLang } from '../../theme/store';

export function CardCreateView({ setId }: { setId: string }) {
  const originalLang = useUnit($originalLang);
  const translationLang = useUnit($translationLang);
  const pending = useUnit(addCardFx.pending);

  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');

  const canSave = original.trim().length > 0 && translation.trim().length > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSave) return;

    await addCardFx({ setId, original, translation, originalLang, translationLang });
    popScreen();
  };

  return (
    <Box grow height="100%">
      <Header back text="Добавить слово" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <InputText
              autoFocus
              floatingLabel
              fullWidth
              placeholder={`Оригинал · ${getLanguageName(originalLang)}`}
              size="m"
              value={original}
              onChange={(value) => setOriginal(value)}
            />
            <InputText
              floatingLabel
              fullWidth
              placeholder={`Перевод · ${getLanguageName(translationLang)}`}
              size="m"
              value={translation}
              onChange={(value) => setTranslation(value)}
            />
            <Button disabled={!canSave} fullWidth loading={pending} type="submit">
              Сохранить
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
