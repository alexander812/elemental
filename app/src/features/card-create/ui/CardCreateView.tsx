import { useState } from 'react';
import type { FormEvent } from 'react';

import { useUnit } from 'effector-react';

import { IconTranslate } from '@elemental/icons';

import { Box, Button, ButtonIcon, Header, InputText, Stack } from '@elemental/ui-kit';

import { getLanguageName } from '../../../lib/languages';
import { $languages } from '../../languages/store';
import { popScreen } from '../../navigation/store';
import { addCardFx } from '../../sets/store';
import { $originalLang, $translationLang } from '../../theme/store';
import { translateFx } from '../store';

export function CardCreateView({ setId }: { setId: string }) {
  const languages = useUnit($languages);
  const originalLang = useUnit($originalLang);
  const translationLang = useUnit($translationLang);
  const pending = useUnit(addCardFx.pending);
  const translationPending = useUnit(translateFx.pending);

  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');
  const [translationFailed, setTranslationFailed] = useState(false);

  const canTranslate = original.trim().length > 0;
  const canSave = canTranslate && translation.trim().length > 0;

  const handleOriginalChange = (value: string) => {
    setOriginal(value);
    setTranslationFailed(false);
  };

  const handleTranslationChange = (value: string) => {
    setTranslation(value);
    setTranslationFailed(false);
  };

  const handleTranslate = async () => {
    if (!canTranslate) return;

    setTranslationFailed(false);

    try {
      const result = await translateFx({ text: original, from: originalLang, to: translationLang });
      setTranslation(result);
    } catch {
      setTranslationFailed(true);
    }
  };

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
            <Stack direction="row" spacing="s" verticalAlign="center">
              <InputText
                autoFocus
                floatingLabel
                fullWidth
                placeholder={`Оригинал · ${getLanguageName(originalLang, languages)}`}
                size="m"
                value={original}
                onChange={handleOriginalChange}
              />
              <ButtonIcon
                ariaLabel="Перевести"
                disabled={!canTranslate}
                icon={<IconTranslate fontSize={24} />}
                loading={translationPending}
                round
                size="m"
                variant="secondary"
                onClick={handleTranslate}
              />
            </Stack>
            <InputText
              floatingLabel
              fullWidth
              helperText={
                translationFailed ? 'Не удалось перевести — введите перевод вручную' : undefined
              }
              placeholder={`Перевод · ${getLanguageName(translationLang, languages)}`}
              size="m"
              value={translation}
              onChange={handleTranslationChange}
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
