import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'

import {
  IconEducation,
  IconMoreVertical,
  IconPlusBig,
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
import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $languages } from '../../languages/store'
import { $lessons } from '../../lessons/store'
import { popScreen, pushScreen, $transition } from '../../navigation/store'
import { createSetFx, updateSetFx, $courseLangByLesson, $sets } from '../../sets/store'
import { $userLang } from '../../theme/store'
import {
  createEmptyPair,
  draftInitialized,
  draftLessonChanged,
  draftNameChanged,
  draftPairAdded,
  draftPairChanged,
  draftPairsTranslated,
  draftReset,
  draftTextsRemapped,
  translateFieldFx,
  translatePairsFx,
  $draftLessonId,
  $draftName,
  $draftPairs,
  $draftTexts,
} from '../store'

export function SetCreateView({ setId, lessonId }: { setId?: string; lessonId?: string }) {
  const sets = useUnit($sets)
  const lessons = useUnit($lessons)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const draftLessonId = useUnit($draftLessonId)
  const name = useUnit($draftName)
  const pairs = useUnit($draftPairs)
  const draftTexts = useUnit($draftTexts)
  const transition = useUnit($transition)
  const createPending = useUnit(createSetFx.pending)
  const updatePending = useUnit(updateSetFx.pending)
  const translatePending = useUnit(translatePairsFx.pending)

  const set = useMemo(
    () => (setId ? sets.find((item) => item.id === setId) : undefined),
    [sets, setId]
  )
  const isEditing = setId !== undefined

  const initialLessonId = set?.lessonId ?? lessonId ?? lessons[0]?.id ?? ''
  const initialCourseLang = courseLangByLesson.get(initialLessonId) ?? DEFAULT_COURSE_LANG
  const courseLang = courseLangByLesson.get(draftLessonId) ?? initialCourseLang

  const initialDraftRef = useRef({
    pushed: transition.kind === 'push',
    draft: {
      lessonId: initialLessonId,
      name: set?.name ?? '',
      pairs: (() => {
        const existing = set
          ? set.cards
              .filter((card) => !card.deleted)
              .map((card) => ({
                ...createEmptyPair(),
                cardId: card.id,
                original: card.texts[userLang] ?? '',
                translation: card.texts[initialCourseLang] ?? '',
              }))
          : []

        return existing.length > 0 ? existing : [createEmptyPair()]
      })(),
      texts: set?.texts ?? {},
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

  const canApply = name.trim().length > 0 && draftLessonId.length > 0
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

  const applyCourseLang = (nextCourseLang: LanguageCode) => {
    setTranslateFailed(false)
    draftTextsRemapped({
      pairs: pairs.map((pair) => {
        const texts = remapTexts(
          { [userLang]: pair.original, [courseLang]: pair.translation },
          userLang,
          nextCourseLang
        )

        return {
          ...pair,
          original: texts[userLang] ?? '',
          translation: texts[nextCourseLang] ?? '',
        }
      }),
      texts: remapTexts(draftTexts, userLang, nextCourseLang),
    })
  }

  const handleLessonChange = (nextLessonId: string) => {
    draftLessonChanged(nextLessonId)

    const nextCourseLang = courseLangByLesson.get(nextLessonId) ?? DEFAULT_COURSE_LANG

    if (nextCourseLang !== courseLang) {
      applyCourseLang(nextCourseLang)
    }
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
      draft: { courseLang },
    })
  }

  const handleTranslateAll = async () => {
    if (!canTranslate) return

    setTranslateFailed(false)

    const { failed, results } = await translatePairsFx({ pairs, userLang, courseLang })

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

    const from = field === 'original' ? userLang : courseLang
    const to = field === 'original' ? courseLang : userLang
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
        pairs: filled.map(({ cardId, original, translation }) => ({
          cardId,
          original,
          translation,
        })),
        texts: draftTexts,
      })

      draftReset()
      popScreen()
      return
    }

    const { setId: createdSetId } = await createSetFx({
      lessonId: draftLessonId,
      name,
      cards: filled.map(({ original, translation }) => ({ original, translation })),
      texts: draftTexts,
    })

    draftReset()
    popScreen()
    pushScreen({ name: 'cards', setId: createdSetId })
  }

  if (isEditing && !set) {
    return (
      <Box grow height="100%">
        <Header back text="Изменить задание" onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Задание не найдено" />
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
                ariaLabel="Меню задания"
                icon={<IconMoreVertical fontSize={24} />}
                variant="flat"
              />
            </Menu.Trigger>
            <Menu.Content>
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
        text={isEditing ? 'Изменить задание' : 'Новое задание'}
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
                  onChange={handleLessonChange}
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
                      lang={userLang}
                      placeholder={getLanguageName(userLang, languages)}
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
                      lang={courseLang}
                      placeholder={getLanguageName(courseLang, languages)}
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
              {isEditing ? 'Сохранить' : 'Применить'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
