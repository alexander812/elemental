import { useUnit } from 'effector-react';

import { IconTranslate } from '@elemental/icons';

import { Box, Button, Divider, FormHelperText, Header, Stack } from '@elemental/ui-kit';

import {
  DEFAULT_ORIGINAL_LANG,
  DEFAULT_TRANSLATION_LANG,
  getLanguageName,
} from '../../../lib/languages';
import { InputWithVoice } from '../../../shared/ui/InputWithVoice';
import { $languages } from '../../languages/store';
import { popScreen, popTo } from '../../navigation/store';
import { addCardsFx, $sets } from '../../sets/store';
import {
  pairOriginalChanged,
  pairTranslationChanged,
  resetTextAdd,
  translateAllFx,
  $pairs,
  $translateFailed,
} from '../store';

export function WordsTranslateView({ setId }: { setId: string }) {
  const pairs = useUnit($pairs);
  const translateFailed = useUnit($translateFailed);
  const translating = useUnit(translateAllFx.pending);
  const adding = useUnit(addCardsFx.pending);
  const languages = useUnit($languages);
  const sets = useUnit($sets);
  const set = sets.find((item) => item.id === setId);
  const originalLang = set?.originalLang ?? DEFAULT_ORIGINAL_LANG;
  const translationLang = set?.translationLang ?? DEFAULT_TRANSLATION_LANG;

  const canTranslate = pairs.some(
    (pair) => pair.original.trim().length > 0 || pair.translation.trim().length > 0,
  );
  const canAdd =
    pairs.length > 0 &&
    pairs.every((pair) => pair.original.trim().length > 0 && pair.translation.trim().length > 0);

  const handleTranslateAll = () => {
    translateAllFx({ pairs, originalLang, translationLang });
  };

  const handleAdd = async () => {
    if (!canAdd) return;

    await addCardsFx({
      setId,
      texts: pairs.map((pair) => ({
        [originalLang]: pair.original,
        [translationLang]: pair.translation,
      })),
    });

    resetTextAdd();
    popTo('cards');
  };

  return (
    <Box grow height="100%">
      <Header back text="Проверьте перевод" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="l">
          {pairs.map((pair, index) => (
            <Stack key={pair.id} spacing="s">
              {index > 0 ? <Divider /> : null}
              <InputWithVoice
                floatingLabel
                fullWidth
                lang={originalLang}
                placeholder={`Оригинал · ${getLanguageName(originalLang, languages)}`}
                size="m"
                value={pair.original}
                onChange={(value) => pairOriginalChanged({ id: pair.id, value })}
              />
              <InputWithVoice
                floatingLabel
                fullWidth
                lang={translationLang}
                placeholder={`Перевод · ${getLanguageName(translationLang, languages)}`}
                size="m"
                value={pair.translation}
                onChange={(value) => pairTranslationChanged({ id: pair.id, value })}
              />
            </Stack>
          ))}

          {translateFailed ? (
            <FormHelperText variant="error">
              Не удалось перевести часть слов — введите перевод вручную
            </FormHelperText>
          ) : null}

          <Button
            disabled={!canTranslate}
            fullWidth
            loading={translating}
            startIcon={<IconTranslate fontSize={24} />}
            variant="secondary"
            onClick={handleTranslateAll}
          >
            Перевести все
          </Button>

          <Button disabled={!canAdd} fullWidth loading={adding} onClick={handleAdd}>
            Добавить
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
