import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'

import {
  IconEducation,
  IconMoreHorizontal,
  IconPlusBig,
  IconSwapVert,
  IconTranslate,
  IconViewList,
} from '@elemental/icons'

import {
  Box,
  Button,
  ButtonIcon,
  Card,
  Divider,
  EmptyScreen,
  FormHelperText,
  Header,
  InputText,
  Menu,
  Select,
  Stack,
  Text,
} from '@elemental/ui-kit'

import { remapTexts } from '../../../lib/cards'
import {
  DEFAULT_ORIGINAL_LANG,
  DEFAULT_TRANSLATION_LANG,
  getLanguageName,
} from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $languages } from '../../languages/store'
import { $lessons } from '../../lessons/store'
import { popScreen, pushScreen, $transition } from '../../navigation/store'
import { createSetFx, updateSetFx, $sets } from '../../sets/store'
import {
  createEmptyPair,
  draftInitialized,
  draftLanguagesChanged,
  draftLessonChanged,
  draftNameChanged,
  draftPairAdded,
  draftPairChanged,
  draftPairsTranslated,
  draftReset,
  translateFieldFx,
  translatePairsFx,
  $draftLessonId,
  $draftName,
  $draftOriginalLang,
  $draftPairs,
  $draftTranslationLang,
} from '../store'

export function SetCreateView({ setId, lessonId }: { setId?: string; lessonId?: string }) {
  const sets = useUnit($sets)
  const lessons = useUnit($lessons)
  const languages = useUnit($languages)
  const draftLessonId = useUnit($draftLessonId)
  const name = useUnit($draftName)
  const originalLang = useUnit($draftOriginalLang)
  const translationLang = useUnit($draftTranslationLang)
  const pairs = useUnit($draftPairs)
  const transition = useUnit($transition)
  const createPending = useUnit(createSetFx.pending)
  const updatePending = useUnit(updateSetFx.pending)
  const translatePending = useUnit(translatePairsFx.pending)

  const set = useMemo(
    () => (setId ? sets.find((item) => item.id === setId) : undefined),
    [sets, setId]
  )
  const isEditing = setId !== undefined

  const parentLesson =
    lessons.find((item) => item.id === (set?.lessonId ?? lessonId)) ?? lessons[0]

  const initialDraftRef = useRef({
    pushed: transition.kind === 'push',
    draft: {
      lessonId: set?.lessonId ?? lessonId ?? parentLesson?.id ?? '',
      name: set?.name ?? '',
      originalLang: set?.originalLang ?? parentLesson?.originalLang ?? DEFAULT_ORIGINAL_LANG,
      translationLang:
        set?.translationLang ?? parentLesson?.translationLang ?? DEFAULT_TRANSLATION_LANG,
      pairs: (() => {
        const existing = set
          ? set.cards
              .filter((card) => !card.deleted)
              .map((card) => ({
                ...createEmptyPair(),
                cardId: card.id,
                original: card.texts[set.originalLang] ?? '',
                translation: card.texts[set.translationLang] ?? '',
              }))
          : []

        return existing.length > 0 ? existing : [createEmptyPair()]
      })(),
    },
  })

  useEffect(() => {
    if (initialDraftRef.current.pushed) draftInitialized(initialDraftRef.current.draft)
  }, [])

  const [translateFailed, setTranslateFailed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [translatingField, setTranslatingField] = useState<{
    id: string
    field: 'original' | 'translation'
  } | null>(null)

  const sameLanguages = originalLang === translationLang
  const canApply = name.trim().length > 0 && !sameLanguages && draftLessonId.length > 0
  const canTranslate = pairs.some(
    (pair) => pair.original.trim().length > 0 || pair.translation.trim().length > 0
  )
  const pending = createPending || updatePending

  const lessonOptions = useMemo(
    () =>
      [...lessons]
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({ label: lesson.name, value: lesson.id })),
    [lessons]
  )

  const applyLanguages = (nextOriginal: LanguageCode, nextTranslation: LanguageCode) => {
    setTranslateFailed(false)
    draftLanguagesChanged({
      originalLang: nextOriginal,
      translationLang: nextTranslation,
      pairs: pairs.map((pair) => {
        const texts = remapTexts(
          { [originalLang]: pair.original, [translationLang]: pair.translation },
          nextOriginal,
          nextTranslation
        )

        return {
          ...pair,
          original: texts[nextOriginal] ?? '',
          translation: texts[nextTranslation] ?? '',
        }
      }),
    })
  }

  const handleSwap = () => {
    applyLanguages(translationLang, originalLang)
  }

  const handlePairChange = (id: string, field: 'original' | 'translation', value: string) => {
    setTranslateFailed(false)
    draftPairChanged({ id, field, value })
  }

  const handleAddPair = () => {
    draftPairAdded()
  }

  const handleAddText = () => {
    pushScreen({
      name: 'text-add',
      draft: { originalLang, translationLang },
    })
  }

  const handleTranslateAll = async () => {
    if (!canTranslate) return

    setTranslateFailed(false)

    const { failed, results } = await translatePairsFx({ pairs, originalLang, translationLang })

    if (results.length > 0) {
      draftPairsTranslated(results)
    }

    setTranslateFailed(failed)
  }

  const handleTranslateField = async (
    pairId: string,
    field: 'original' | 'translation',
    text: string
  ) => {
    if (!text.trim()) return

    const from = field === 'original' ? originalLang : translationLang
    const to = field === 'original' ? translationLang : originalLang
    const target = field === 'original' ? 'translation' : 'original'

    setTranslateFailed(false)
    setTranslatingField({ id: pairId, field })

    try {
      const value = await translateFieldFx({ from, text: text.trim(), to })
      draftPairChanged({ id: pairId, field: target, value })
    } catch {
      setTranslateFailed(true)
    } finally {
      setTranslatingField(null)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canApply) return

    const filled = pairs.filter(
      (pair) =>
        pair.cardId !== undefined ||
        pair.original.trim().length > 0 ||
        pair.translation.trim().length > 0
    )

    if (isEditing && set) {
      await updateSetFx({
        setId: set.id,
        lessonId: draftLessonId,
        name,
        originalLang,
        translationLang,
        pairs: filled.map(({ cardId, original, translation }) => ({
          cardId,
          original,
          translation,
        })),
      })

      draftReset()
      popScreen()
      return
    }

    const { setId: createdSetId } = await createSetFx({
      lessonId: draftLessonId,
      name,
      originalLang,
      translationLang,
      cards: filled.map(({ original, translation }) => ({ original, translation })),
    })

    draftReset()
    popScreen()
    pushScreen({ name: 'cards', setId: createdSetId })
  }

  if (isEditing && !set) {
    return (
      <Box grow height="100%">
        <Header back text="Изменить набор" onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Набор не найден" />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header
        back
        endToolbar={
          <Menu.Root open={menuOpen} onToggle={setMenuOpen}>
            <Menu.Trigger>
              <ButtonIcon
                ariaLabel="Меню набора"
                icon={<IconMoreHorizontal fontSize={24} />}
                variant="flat"
              />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item
                icon={<IconSwapVert fontSize={16} />}
                label="Поменять местами"
                onClick={handleSwap}
              />
              <Menu.Item
                icon={<IconViewList fontSize={16} />}
                label="Добавить текст"
                onClick={handleAddText}
              />
              <Menu.Item
                disabled={!canTranslate || translatePending}
                icon={<IconTranslate fontSize={16} />}
                label="Перевести всё"
                onClick={handleTranslateAll}
              />
            </Menu.Content>
          </Menu.Root>
        }
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
              onChange={draftNameChanged}
            />

            <Card padding="l">
              <Stack spacing="xs">
                <Text color="contrast-secondary" variant="XS / Medium">
                  Урок
                </Text>
                <Select
                  fullWidth
                  options={lessonOptions}
                  value={draftLessonId}
                  onChange={draftLessonChanged}
                />
              </Stack>
            </Card>

            <Card padding="m">
              <Stack spacing="m">
                {pairs.map((pair, index) => (
                  <Stack key={pair.id} spacing="s">
                    {index > 0 ? <Divider /> : null}
                    <InputWithVoice
                      floatingLabel
                      fullWidth
                      lang={originalLang}
                      placeholder={`Оригинал · ${getLanguageName(originalLang, languages)}`}
                      size="m"
                      translating={
                        translatingField?.id === pair.id && translatingField.field === 'original'
                      }
                      value={pair.original}
                      onChange={(value) => handlePairChange(pair.id, 'original', value)}
                      onTranslate={() =>
                        handleTranslateField(pair.id, 'original', pair.original)
                      }
                    />
                    <InputWithVoice
                      floatingLabel
                      fullWidth
                      lang={translationLang}
                      placeholder={`Перевод · ${getLanguageName(translationLang, languages)}`}
                      size="m"
                      translating={
                        translatingField?.id === pair.id &&
                        translatingField.field === 'translation'
                      }
                      value={pair.translation}
                      onChange={(value) => handlePairChange(pair.id, 'translation', value)}
                      onTranslate={() =>
                        handleTranslateField(pair.id, 'translation', pair.translation)
                      }
                    />
                  </Stack>
                ))}
              </Stack>
            </Card>

            {translateFailed ? (
              <FormHelperText variant="error">
                Не удалось перевести — введите перевод вручную
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

            <Button disabled={!canApply} fullWidth loading={pending} type="submit">
              Сохранить
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
