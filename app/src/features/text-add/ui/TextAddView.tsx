import { useEffect, useRef } from 'react';

import { useUnit } from 'effector-react';

import { Box, Button, Chip, Header, Stack, Text, Textarea } from '@elemental/ui-kit';

import { popScreen, pushScreen, $transition } from '../../navigation/store';
import {
  pairsCreated,
  resetTextAdd,
  textChanged,
  textEditRequested,
  textParsed,
  wordToggled,
  $selected,
  $step,
  $text,
  $words,
} from '../store';

export function TextAddView({ setId }: { setId: string }) {
  const text = useUnit($text);
  const step = useUnit($step);
  const words = useUnit($words);
  const selected = useUnit($selected);
  const transition = useUnit($transition);

  const shouldResetRef = useRef(transition.kind === 'push');

  useEffect(() => {
    if (shouldResetRef.current) resetTextAdd();
  }, []);

  const canParse = text.trim().length > 0;
  const canProcess = selected.length > 0;

  const handleProcess = () => {
    pairsCreated();
    pushScreen({ name: 'words-translate', setId });
  };

  return (
    <Box grow height="100%">
      <Header back text="Добавить текст" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        {step === 'input' ? (
          <Stack spacing="l">
            <Textarea
              fullWidth
              placeholder="Введите или вставьте текст"
              rows={6}
              value={text}
              onChange={textChanged}
            />
            <Button disabled={!canParse} fullWidth onClick={() => textParsed()}>
              Разобрать
            </Button>
          </Stack>
        ) : (
          <Stack spacing="l">
            <Stack direction="row" spacing="s" wrap="wrap">
              {words.map((word) => (
                <Chip
                  key={word}
                  checked={selected.includes(word)}
                  label={word}
                  onClick={() => wordToggled(word)}
                />
              ))}
            </Stack>
            <Text color="contrast-secondary" variant="XS / Medium">
              {selected.length > 0
                ? `Выбрано слов: ${selected.length}`
                : 'Нажмите на слова, для которых нужно создать карточки'}
            </Text>
            <Button disabled={!canProcess} fullWidth onClick={handleProcess}>
              Обработать
            </Button>
            <Button fullWidth variant="secondary" onClick={() => textEditRequested()}>
              Изменить текст
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
