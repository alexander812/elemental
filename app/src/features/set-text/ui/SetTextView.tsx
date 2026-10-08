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
  Spinner,
  Stack,
  Text,
} from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import { parseWords } from '../../../lib/words'
import { $languages } from '../../languages/store'
import { popScreen, pushScreen, $transition } from '../../navigation/store'
import { $courseLangByLesson, $sets } from '../../sets/store'
import { $userLang } from '../../theme/store'
import {
  createCardsClicked,
  resetSetText,
  segmentsLoaded,
  tabChanged,
  translateSegmentFx,
  translateSetTextFx,
  wordToggled,
  wordsMerged,
  $selected,
  $tab,
  $words,
} from '../store'

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

export function SetTextView({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const tab = useUnit($tab)
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

  const set = sets.find((item) => item.id === setId)
  const courseLang = (set ? courseLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_COURSE_LANG
  const userText = (set?.texts[userLang] ?? '').trim()
  const courseText = (set?.texts[courseLang] ?? '').trim()
  const currentLang = tab === 'user' ? userLang : courseLang
  const oppositeLang = tab === 'user' ? courseLang : userLang
  const currentText = tab === 'user' ? userText : courseText
  const oppositeText = tab === 'user' ? courseText : userText

  const shouldResetRef = useRef(transition.kind === 'push')

  useEffect(() => {
    if (shouldResetRef.current) resetSetText()
  }, [])

  useEffect(() => {
    segmentsLoaded(parseWords(currentText))
  }, [currentText, tab])

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
    const segmentFrom = currentLang
    const segmentTo = oppositeLang

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

      translateSegmentFx({ from: segmentFrom, text: word, to: segmentTo })
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

  const handleTranslate = async () => {
    if (!oppositeText) return

    setTranslateFailed(false)

    try {
      await translateSetTextFx({
        from: oppositeLang,
        setId,
        text: oppositeText,
        to: currentLang,
      })
    } catch {
      setTranslateFailed(true)
    }
  }

  const handleCreateCards = () => {
    createCardsClicked()
    pushScreen({ name: 'words-translate', setId })
  }

  if (!set) {
    return (
      <Box grow height="100%">
        <Header back text="Текст задания" onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconViewList fontSize={24} />} text="Задание не найдено" />
      </Box>
    )
  }

  return (
    <div className={classes.root}>
      <Header back text="Текст задания" onBackClick={() => popScreen()} />
      <div className={classes.layout}>
        <Stack direction="row" spacing="s">
          <Button
            checked={tab === 'user'}
            fullWidth
            variant="secondary"
            onClick={() => tabChanged('user')}
          >
            {getLanguageName(userLang, languages)}
          </Button>
          <Button
            checked={tab === 'course'}
            fullWidth
            variant="secondary"
            onClick={() => tabChanged('course')}
          >
            {getLanguageName(courseLang, languages)}
          </Button>
        </Stack>

        {currentText ? (
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
        ) : (
          <Box grow>
            <EmptyScreen
              action={
                oppositeText ? (
                  <Stack horizontalAlign="center" spacing="s">
                    <Button
                      loading={translating}
                      startIcon={<IconTranslate fontSize={24} />}
                      onClick={handleTranslate}
                    >
                      Перевести
                    </Button>
                    {translateFailed ? (
                      <FormHelperText variant="error">Не удалось перевести текст</FormHelperText>
                    ) : null}
                  </Stack>
                ) : undefined
              }
              fullHeight
              icon={<IconViewList fontSize={24} />}
              text={`Нет текста на языке ${getLanguageName(currentLang, languages)}`}
            />
          </Box>
        )}

        <div className={classes.footer}>
          <Text color="contrast-secondary" variant="XS / Medium">
            {selected.length > 0
              ? `Выбрано слов: ${selected.length}`
              : 'Нажмите на слова или проведите пальцем по соседним, чтобы объединить их. Удерживайте слово 2 секунды, чтобы увидеть перевод'}
          </Text>
          {selected.length > 0 ? (
            <Button fullWidth onClick={handleCreateCards}>
              Создать карточки
            </Button>
          ) : null}
        </div>
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
