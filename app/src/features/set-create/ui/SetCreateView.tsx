import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { useUnit } from 'effector-react';

import { IconEducation, IconPlusBig, IconSwapVert, IconTranslate } from '@elemental/icons';

import {
  Box,
  Button,
  Card,
  Divider,
  EmptyScreen,
  FormHelperText,
  Header,
  InputText,
  Select,
  Stack,
  Text,
} from '@elemental/ui-kit';

import { remapTexts } from '../../../lib/cards';
import { getLanguageName } from '../../../lib/languages';
import type { LanguageCode } from '../../../lib/languages';
import { uid } from '../../../lib/uid';
import { $languages } from '../../languages/store';
import { popScreen, pushScreen } from '../../navigation/store';
import { createSetFx, updateSetFx, $sets } from '../../sets/store';
import { $originalLang, $translationLang } from '../../theme/store';
import { translatePairsFx } from '../store';

type PairDraft = {
  id: string;
  cardId?: string;
  original: string;
  translation: string;
};

const createEmptyPair = (): PairDraft => ({ id: uid(), original: '', translation: '' });

export function SetCreateView({ setId }: { setId?: string }) {
  const sets = useUnit($sets);
  const languages = useUnit($languages);
  const settingsOriginalLang = useUnit($originalLang);
  const settingsTranslationLang = useUnit($translationLang);
  const createPending = useUnit(createSetFx.pending);
  const updatePending = useUnit(updateSetFx.pending);
  const translatePending = useUnit(translatePairsFx.pending);

  const set = useMemo(
    () => (setId ? sets.find((item) => item.id === setId) : undefined),
    [sets, setId],
  );
  const isEditing = setId !== undefined;

  const [name, setName] = useState(() => set?.name ?? '');
  const [originalLang, setOriginalLang] = useState(() => set?.originalLang ?? settingsOriginalLang);
  const [translationLang, setTranslationLang] = useState(
    () => set?.translationLang ?? settingsTranslationLang,
  );
  const [pairs, setPairs] = useState<PairDraft[]>(() => {
    const existing = set
      ? set.cards
          .filter((card) => !card.deleted)
          .map((card) => ({
            id: uid(),
            cardId: card.id,
            original: card.texts[set.originalLang] ?? '',
            translation: card.texts[set.translationLang] ?? '',
          }))
      : [];

    return existing.length > 0 ? existing : [createEmptyPair()];
  });

  const [translateFailed, setTranslateFailed] = useState(false);

  const sameLanguages = originalLang === translationLang;
  const canApply = name.trim().length > 0 && !sameLanguages;
  const canTranslate = pairs.some(
    (pair) => pair.original.trim().length > 0 || pair.translation.trim().length > 0,
  );
  const pending = createPending || updatePending;

  const options = useMemo(
    () => languages.map((language) => ({ label: language.name, value: language.code })),
    [languages],
  );

  const originalOptions = useMemo(
    () => options.map((option) => ({ ...option, disabled: option.value === translationLang })),
    [options, translationLang],
  );
  const translationOptions = useMemo(
    () => options.map((option) => ({ ...option, disabled: option.value === originalLang })),
    [options, originalLang],
  );

  const applyLanguages = (nextOriginal: LanguageCode, nextTranslation: LanguageCode) => {
    setTranslateFailed(false);
    setPairs((prev) =>
      prev.map((pair) => {
        const texts = remapTexts(
          { [originalLang]: pair.original, [translationLang]: pair.translation },
          nextOriginal,
          nextTranslation,
        );

        return {
          ...pair,
          original: texts[nextOriginal] ?? '',
          translation: texts[nextTranslation] ?? '',
        };
      }),
    );
    setOriginalLang(nextOriginal);
    setTranslationLang(nextTranslation);
  };

  const handleOriginalChange = (value: string) => {
    applyLanguages(value, translationLang);
  };

  const handleTranslationChange = (value: string) => {
    applyLanguages(originalLang, value);
  };

  const handleSwap = () => {
    applyLanguages(translationLang, originalLang);
  };

  const handlePairChange = (id: string, field: 'original' | 'translation', value: string) => {
    setTranslateFailed(false);
    setPairs((prev) => prev.map((pair) => (pair.id === id ? { ...pair, [field]: value } : pair)));
  };

  const handleAddPair = () => {
    setPairs((prev) => [...prev, createEmptyPair()]);
  };

  const handleTranslateAll = async () => {
    if (!canTranslate) return;

    setTranslateFailed(false);

    const { failed, results } = await translatePairsFx({ pairs, originalLang, translationLang });

    if (results.length > 0) {
      setPairs((prev) =>
        prev.map((pair) => {
          const result = results.find((item) => item.id === pair.id);

          return result ? { ...pair, [result.field]: result.value } : pair;
        }),
      );
    }

    setTranslateFailed(failed);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canApply) return;

    const filled = pairs.filter(
      (pair) =>
        pair.cardId !== undefined ||
        pair.original.trim().length > 0 ||
        pair.translation.trim().length > 0,
    );

    if (isEditing && set) {
      await updateSetFx({
        setId: set.id,
        name,
        originalLang,
        translationLang,
        pairs: filled.map(({ cardId, original, translation }) => ({
          cardId,
          original,
          translation,
        })),
      });

      popScreen();
      return;
    }

    const { setId: createdSetId } = await createSetFx({
      name,
      originalLang,
      translationLang,
      cards: filled.map(({ original, translation }) => ({ original, translation })),
    });

    popScreen();
    pushScreen({ name: 'cards', setId: createdSetId });
  };

  if (isEditing && !set) {
    return (
      <Box grow height="100%">
        <Header back text="Изменить набор" onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Набор не найден" />
      </Box>
    );
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={isEditing ? 'Изменить набор' : 'Новый набор'}
        onBackClick={() => popScreen()}
      />
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

            <Card padding="l">
              <Stack spacing="m">
                <Stack spacing="xs">
                  <Text color="contrast-secondary" variant="XS / Medium">
                    Язык оригинала
                  </Text>
                  <Select
                    fullWidth
                    options={originalOptions}
                    value={originalLang}
                    onChange={handleOriginalChange}
                  />
                </Stack>
                <Button
                  fullWidth
                  startIcon={<IconSwapVert fontSize={24} />}
                  variant="secondary"
                  onClick={handleSwap}
                >
                  Поменять местами
                </Button>
                <Stack spacing="xs">
                  <Text color="contrast-secondary" variant="XS / Medium">
                    Язык перевода
                  </Text>
                  <Select
                    fullWidth
                    options={translationOptions}
                    value={translationLang}
                    onChange={handleTranslationChange}
                  />
                </Stack>
              </Stack>
            </Card>

            {sameLanguages ? (
              <FormHelperText variant="error">
                Языки оригинала и перевода должны различаться
              </FormHelperText>
            ) : null}

            <Card padding="m">
              <Stack spacing="m">
                {pairs.map((pair, index) => (
                  <Stack key={pair.id} spacing="s">
                    {index > 0 ? <Divider /> : null}
                    <InputText
                      floatingLabel
                      fullWidth
                      placeholder={`Оригинал · ${getLanguageName(originalLang, languages)}`}
                      size="m"
                      value={pair.original}
                      onChange={(value) => handlePairChange(pair.id, 'original', value)}
                    />
                    <InputText
                      floatingLabel
                      fullWidth
                      placeholder={`Перевод · ${getLanguageName(translationLang, languages)}`}
                      size="m"
                      value={pair.translation}
                      onChange={(value) => handlePairChange(pair.id, 'translation', value)}
                    />
                  </Stack>
                ))}
              </Stack>
            </Card>

            {translateFailed ? (
              <FormHelperText variant="error">
                Не удалось перевести часть слов — введите перевод вручную
              </FormHelperText>
            ) : null}

            <Button
              fullWidth
              startIcon={<IconPlusBig fontSize={16} />}
              variant="secondary"
              onClick={handleAddPair}
            >
              Добавить слово
            </Button>

            <Button
              disabled={!canTranslate}
              fullWidth
              loading={translatePending}
              startIcon={<IconTranslate fontSize={24} />}
              variant="secondary"
              onClick={handleTranslateAll}
            >
              Перевести все
            </Button>

            <Button disabled={!canApply} fullWidth loading={pending} type="submit">
              {isEditing ? 'Сохранить' : 'Применить'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
