import { useEffect, useRef, useState } from 'react'

import { useUnit } from 'effector-react'

import { IconClose, IconEdit, IconViewList } from '@elemental/icons'
import {
  Box,
  Button,
  ButtonIcon,
  EmptyScreen,
  FormHelperText,
  Header,
  Stack,
  Text,
  TextPanel,
} from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../../lib/languages'
import { parseWords, selectedWordTexts } from '../../../../lib/words'
import { ConfirmSheet } from '../../../../shared/ui/ConfirmSheet'
import { $languages } from '../../../languages/store'
import {
  popScreen,
  popTo,
  pushScreen,
  replaceScreen,
  $stack,
  $transition,
} from '../../../navigation/store'
import type { TextAddDraft } from '../../../navigation/store'
import { draftWordsAdded, $draftTexts } from '../../../set-create/store'
import {
  deleteCardsFx,
  deleteSetFx,
  resetSetFx,
  $courseLangByLesson,
  $sets,
} from '../../../sets/store'
import { SetMenu } from '../../../sets/ui/SetMenu'
import { $userLang } from '../../../theme/store'
import {
  createCardsClicked,
  editStarted,
  resetTextAdd,
  segmentsLoaded,
  selectionCleared,
  textLangChanged,
  $selected,
  $textLang,
  $words,
} from '../../../text-add/store'
import { translateSetTextFx } from '../../store'
import { WordsPanel } from './components/WordsPanel'

import classes from './SetTextView.module.pcss'

type SetTextViewProps = (
  { setId: string; draft?: undefined } | { setId?: undefined; draft: TextAddDraft }
) & { welcome?: boolean }

export function SetTextView({ setId, draft, welcome }: SetTextViewProps) {
  const sets = useUnit($sets)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const draftTexts = useUnit($draftTexts)
  const storedLang = useUnit($textLang)
  const words = useUnit($words)
  const selected = useUnit($selected)
  const stack = useUnit($stack)
  const transition = useUnit($transition)
  const translating = useUnit(translateSetTextFx.pending)
  const resetPending = useUnit(resetSetFx.pending)
  const deletePending = useUnit(deleteSetFx.pending)

  const [translateFailed, setTranslateFailed] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = setId ? sets.find((item) => item.id === setId) : undefined
  const courseLang =
    (set ? courseLangByLesson.get(set.lessonId) : undefined) ??
    draft?.courseLang ??
    DEFAULT_COURSE_LANG
  const texts = setId ? (set?.texts ?? {}) : draftTexts
  const lang = storedLang ?? courseLang
  const otherLang = lang === userLang ? courseLang : userLang
  const currentText = (texts[lang] ?? '').trim()
  const oppositeText = (texts[otherLang] ?? '').trim()
  const hasAnyText = currentText.length > 0 || oppositeText.length > 0
  const hasText = currentText.length > 0
  const interactive = lang === courseLang
  const canCreateCards = interactive && hasText && selected.length > 0

  const shouldResetRef = useRef(transition.kind === 'push')

  useEffect(() => {
    if (shouldResetRef.current) resetTextAdd()
  }, [])

  useEffect(() => {
    segmentsLoaded(parseWords(currentText))
  }, [currentText, lang])

  const handleEdit = () => {
    editStarted({ lang, text: texts[lang] ?? '' })

    if (setId) {
      pushScreen({ name: 'text-add', setId })
      return
    }

    pushScreen({ name: 'text-add', draft: { courseLang } })
  }

  const handleTranslate = async () => {
    if (!oppositeText) return

    setTranslateFailed(false)

    try {
      await translateSetTextFx({
        draft: setId === undefined,
        from: otherLang,
        setId,
        text: oppositeText,
        to: lang,
      })
    } catch {
      setTranslateFailed(true)
    }
  }

  const handleCreateCards = () => {
    if (!canCreateCards) return

    const field = lang === userLang ? 'original' : 'translation'

    if (setId) {
      createCardsClicked(field)
      pushScreen({ name: 'words-translate', setId })
      return
    }

    draftWordsAdded({ field, words: selectedWordTexts(words, selected) })
    popScreen()
  }

  const handleNext = () => {
    if (!setId) return

    const previous = stack[stack.length - 2]

    if (previous?.name === 'cards' && previous.setId === setId) {
      popScreen()
      return
    }

    replaceScreen({ name: 'cards', setId })
  }

  const handleDeleteAllCards = async () => {
    if (!setId) return

    await deleteCardsFx({ setId, learned: false })
    await deleteCardsFx({ setId, learned: true })
  }

  const handleConfirmReset = async () => {
    if (!setId) return

    await resetSetFx(setId)
    setConfirmReset(false)
  }

  const handleConfirmDelete = async () => {
    if (!setId) return

    await deleteSetFx(setId)
    setConfirmDelete(false)

    if (stack.some((screen) => screen.name === 'lesson')) {
      popTo('lesson')
      return
    }

    popScreen()
  }

  if (setId && !set) {
    return (
      <Box grow height="100%">
        <Header back text={welcome ? 'Задание' : 'Текст задания'} onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconViewList fontSize={24} />} text="Задание не найдено" />
      </Box>
    )
  }

  return (
    <div className={classes.root}>
      <Header
        back
        endToolbar={
          welcome && set ? (
            <SetMenu
              setId={set.id}
              swapped={set.swapped}
              onDeleteCards={handleDeleteAllCards}
              onDeleteSet={() => setConfirmDelete(true)}
              onResetSet={() => setConfirmReset(true)}
            />
          ) : undefined
        }
        text={welcome ? (set?.name ?? '') : hasAnyText ? 'Изменить текст' : 'Добавить текст'}
        onBackClick={() => popScreen()}
      />
      <div className={classes.layout}>
        <Stack
          direction="row"
          horizontalAlign={hasAnyText ? 'space-between' : 'end'}
          spacing="s"
          verticalAlign="center"
        >
          {hasAnyText ? (
            <Stack direction="row" spacing="xs">
              <Button
                checked={lang === courseLang}
                size="s"
                variant={lang === courseLang ? 'secondary' : 'flat'}
                onClick={() => textLangChanged(courseLang)}
              >
                {getLanguageName(courseLang, languages)}
              </Button>
              <Button
                checked={lang === userLang}
                size="s"
                variant={lang === userLang ? 'secondary' : 'flat'}
                onClick={() => textLangChanged(userLang)}
              >
                {getLanguageName(userLang, languages)}
              </Button>
            </Stack>
          ) : null}
          <Stack direction="row" spacing="xs" verticalAlign="center">
            {words.length > 0 ? (
              <Button
                disabled={selected.length === 0}
                size="s"
                variant="flat"
                onClick={() => selectionCleared()}
              >
                Очистить
              </Button>
            ) : null}
            {welcome ? null : (
              <ButtonIcon
                ariaLabel={hasAnyText ? 'Изменить текст' : 'Добавить текст'}
                icon={<IconEdit fontSize={24} />}
                variant="flat"
                onClick={handleEdit}
              />
            )}
          </Stack>
        </Stack>

        {hasText ? (
          <WordsPanel
            interactive={interactive}
            lang={lang}
            otherLang={otherLang}
            selected={selected}
            words={words}
          />
        ) : (
          <TextPanel grow>
            <Stack height="100%" horizontalAlign="center" spacing="s" verticalAlign="center">
              <Text color="contrast-tertiary" variant="S / Medium">
                Текст ещё не заполнен
              </Text>
              {hasAnyText ? (
                <Button loading={translating} onClick={handleTranslate}>
                  Перевести
                </Button>
              ) : null}
            </Stack>
          </TextPanel>
        )}

        {translateFailed ? (
          <FormHelperText variant="error">Не удалось перевести текст</FormHelperText>
        ) : null}

        {welcome ? (
          <Button fullWidth onClick={handleNext}>
            Далее
          </Button>
        ) : (
          <Stack direction="row" spacing="s" verticalAlign="center">
            <Button disabled={!canCreateCards} fullWidth onClick={handleCreateCards}>
              Создать карточки
            </Button>
            <ButtonIcon
              ariaLabel="Закрыть"
              icon={<IconClose fontSize={24} />}
              variant="secondary"
              onClick={() => popScreen()}
            />
          </Stack>
        )}
      </div>

      <ConfirmSheet
        opened={confirmReset}
        text="Вы уверены, что хотите сбросить результаты? Карточки вернутся в невыученные, как будто вы их не трогали."
        onClosed={() => setConfirmReset(false)}
      >
        <Button fullWidth loading={resetPending} onClick={handleConfirmReset}>
          Да
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setConfirmReset(false)}>
          Отмена
        </Button>
      </ConfirmSheet>

      <ConfirmSheet
        opened={confirmDelete}
        text={`Удалить задание «${set?.name ?? ''}» со всеми карточками?`}
        onClosed={() => setConfirmDelete(false)}
      >
        <Button color="negative" fullWidth loading={deletePending} onClick={handleConfirmDelete}>
          Удалить
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setConfirmDelete(false)}>
          Отмена
        </Button>
      </ConfirmSheet>
    </div>
  )
}
