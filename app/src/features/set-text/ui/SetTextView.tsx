import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { useUnit } from 'effector-react'

import { IconTranslate, IconViewList } from '@elemental/icons'

import {
  Box,
  Button,
  EmptyScreen,
  FormHelperText,
  Header,
  Select,
  Spinner,
  Text,
  TextPanel,
} from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import { parseWords } from '../../../lib/words'
import { $languages } from '../../languages/store'
import { popScreen, pushScreen, $transition } from '../../navigation/store'
import type { TextAddDraft } from '../../navigation/store'
import { draftWordsAdded, $draftTexts } from '../../set-create/store'
import { $courseLangByLesson, $sets } from '../../sets/store'
import { $userLang } from '../../theme/store'
import {
  createCardsClicked,
  editStarted,
  resetTextAdd,
  segmentsLoaded,
  textLangChanged,
  wordToggled,
  wordsMerged,
  $selected,
  $textLang,
  $words,
} from '../../text-add/store'
import { translateSegmentFx, translateSetTextFx } from '../store'

import classes from './SetTextView.module.pcss'

const DRAG_SLOP = 8
const HOLD_MS = 2000
const TOOLTIP_EDGE = 72

type ChipDrag = {
  active: boolean
  pointerId: number
  startWord: string
  startX: number
  startY: number
  words: string[]
}

type Tooltip = {
  word: string
  x: number
  y: number
  status: 'loading' | 'done' | 'error'
  text: string
}

type SetTextViewProps =
  | { setId: string; draft?: undefined }
  | { setId?: undefined; draft: TextAddDraft }

export function SetTextView({ setId, draft }: SetTextViewProps) {
  const sets = useUnit($sets)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const draftTexts = useUnit($draftTexts)
  const storedLang = useUnit($textLang)
  const words = useUnit($words)
  const selected = useUnit($selected)
  const transition = useUnit($transition)
  const translating = useUnit(translateSetTextFx.pending)

  const [dragWords, setDragWords] = useState<string[]>([])
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [translateFailed, setTranslateFailed] = useState(false)

  const dragRef = useRef<ChipDrag | null>(null)
  const suppressClickRef = useRef(false)
  const touchBlockerRef = useRef<((event: TouchEvent) => void) | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  const hasText = currentText.length > 0
  const canCreateCards = hasText && selected.length > 0

  const langOptions = [
    { label: getLanguageName(userLang, languages), value: userLang },
    { label: getLanguageName(courseLang, languages), value: courseLang },
  ]

  const shouldResetRef = useRef(transition.kind === 'push')

  useEffect(() => {
    if (shouldResetRef.current) resetTextAdd()
  }, [])

  useEffect(() => {
    segmentsLoaded(parseWords(currentText))
  }, [currentText, lang])

  const setTouchBlocked = (blocked: boolean) => {
    if (blocked) {
      if (!touchBlockerRef.current) {
        touchBlockerRef.current = (event: TouchEvent) => {
          event.preventDefault()
        }
        document.addEventListener('touchmove', touchBlockerRef.current, { passive: false })
      }
    } else if (touchBlockerRef.current) {
      document.removeEventListener('touchmove', touchBlockerRef.current)
      touchBlockerRef.current = null
    }
  }

  const clearHold = () => {
    if (!holdTimerRef.current) return

    clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
  }

  useEffect(() => {
    return () => {
      clearHold()
      setTouchBlocked(false)
    }
  }, [])

  const findWordAt = (clientX: number, clientY: number): string | null => {
    const element = document.elementFromPoint(clientX, clientY)
    const word = element?.closest<HTMLElement>('[data-word]')

    return word?.dataset.word ?? null
  }

  const handleWordPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, word: string) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    clearHold()
    suppressClickRef.current = false
    dragRef.current = {
      active: false,
      pointerId: event.pointerId,
      startWord: word,
      startX: event.clientX,
      startY: event.clientY,
      words: [],
    }

    const target = event.currentTarget

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null
      suppressClickRef.current = true

      const rect = target.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2

      setTooltip({
        status: 'loading',
        text: '',
        word,
        x: Math.min(Math.max(centerX, TOOLTIP_EDGE), window.innerWidth - TOOLTIP_EDGE),
        y: rect.top,
      })

      translateSegmentFx({ from: lang, text: word, to: otherLang })
        .then((translation) => {
          setTooltip((prev) =>
            prev && prev.word === word ? { ...prev, status: 'done', text: translation } : prev
          )
        })
        .catch(() => {
          setTooltip((prev) =>
            prev && prev.word === word ? { ...prev, status: 'error', text: '' } : prev
          )
        })
    }, HOLD_MS)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    if (!drag.active) {
      const moveX = event.clientX - drag.startX
      const moveY = event.clientY - drag.startY

      if (Math.hypot(moveX, moveY) < DRAG_SLOP) return

      clearHold()

      if (event.pointerType !== 'mouse' && Math.abs(moveY) > Math.abs(moveX)) {
        dragRef.current = null
        setDragWords([])
        setTooltip(null)
        suppressClickRef.current = true
        return
      }

      drag.active = true
      drag.words = [drag.startWord]
      setDragWords([drag.startWord])
      setTooltip(null)
      setTouchBlocked(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }

    const word = findWordAt(event.clientX, event.clientY)

    if (word && !drag.words.includes(word)) {
      drag.words.push(word)
      setDragWords([...drag.words])
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    setDragWords([])
    clearHold()
    setTooltip(null)

    if (!drag.active) return

    setTouchBlocked(false)
    suppressClickRef.current = true

    if (drag.words.length > 1) {
      wordsMerged(drag.words)
    }
  }

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    setDragWords([])
    clearHold()
    setTooltip(null)
    setTouchBlocked(false)
  }

  const handleWordClick = (word: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    wordToggled(word)
  }

  const handleScroll = () => {
    clearHold()
    setTooltip(null)
  }

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
    const field = lang === userLang ? 'original' : 'translation'

    if (setId) {
      createCardsClicked(field)
      pushScreen({ name: 'words-translate', setId })
      return
    }

    draftWordsAdded({ field, words: selected })
    popScreen()
  }

  if (setId && !set) {
    return (
      <Box grow height="100%">
        <Header back text="Текст задания" onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconViewList fontSize={24} />} text="Задание не найдено" />
      </Box>
    )
  }

  return (
    <div className={classes.root}>
      <Header
        back
        text={hasText ? 'Изменить текст' : 'Добавить текст'}
        onBackClick={() => popScreen()}
      />
      <div className={classes.layout}>
        <Select fullWidth options={langOptions} value={lang} onChange={textLangChanged} />

        {hasText ? (
          <TextPanel grow>
            <div
              className={classes.wordsScroll}
              onPointerCancel={handlePointerCancel}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onScroll={handleScroll}
            >
              <div className={classes.words}>
                {words.map((word) => {
                  const checked = selected.includes(word) || dragWords.includes(word)

                  return (
                    <button
                      key={word}
                      aria-pressed={checked}
                      className={checked ? `${classes.word} ${classes.wordChecked}` : classes.word}
                      data-word={word}
                      type="button"
                      onClick={() => handleWordClick(word)}
                      onPointerDown={(event) => handleWordPointerDown(event, word)}
                    >
                      {word}
                    </button>
                  )
                })}
              </div>
            </div>
          </TextPanel>
        ) : (
          <TextPanel placeholder="Текст ещё не заполнен" />
        )}

        {!hasText && oppositeText ? (
          <Button
            fullWidth
            loading={translating}
            startIcon={<IconTranslate fontSize={24} />}
            variant="secondary"
            onClick={handleTranslate}
          >
            Перевести на {getLanguageName(lang, languages)}
          </Button>
        ) : null}

        {translateFailed ? (
          <FormHelperText variant="error">Не удалось перевести текст</FormHelperText>
        ) : null}

        <Button fullWidth variant="secondary" onClick={handleEdit}>
          {hasText ? 'Изменить' : 'Добавить'}
        </Button>

        <Button disabled={!canCreateCards} fullWidth onClick={handleCreateCards}>
          Создать карточки
        </Button>
      </div>

      {tooltip ? (
        <div className={classes.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.status === 'loading' ? (
            <Spinner size="s" />
          ) : tooltip.status === 'error' ? (
            <Text color="contrast-secondary" variant="S / Medium">
              Не удалось перевести
            </Text>
          ) : (
            <Text variant="S / Medium">{tooltip.text}</Text>
          )}
        </div>
      ) : null}
    </div>
  )
}
