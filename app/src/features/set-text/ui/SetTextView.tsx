import { Fragment, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { useUnit } from 'effector-react'

import { IconClose, IconEdit, IconViewList } from '@elemental/icons'

import {
  Box,
  Button,
  ButtonIcon,
  EmptyScreen,
  FormHelperText,
  Header,
  Spinner,
  Stack,
  Text,
  TextPanel,
} from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import { parseWords, selectedWordTexts } from '../../../lib/words'
import type { WordSegment } from '../../../lib/words'
import { $languages } from '../../languages/store'
import { popScreen, pushScreen, replaceScreen, $stack, $transition } from '../../navigation/store'
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
const HOLD_MS = 1000
const TOOLTIP_EDGE = 72

type ChipDrag = {
  active: boolean
  pointerId: number
  startId: string
  startX: number
  startY: number
  ids: string[]
}

type Tooltip = {
  id: string
  x: number
  y: number
  status: 'loading' | 'done' | 'error'
  text: string
}

type SetTextViewProps = (
  | { setId: string; draft?: undefined }
  | { setId?: undefined; draft: TextAddDraft }
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

  const [dragIds, setDragIds] = useState<string[]>([])
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

  const handleWordPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    segment: WordSegment
  ) => {
    if (!interactive) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    clearHold()
    suppressClickRef.current = false
    dragRef.current = {
      active: false,
      pointerId: event.pointerId,
      startId: segment.id,
      startX: event.clientX,
      startY: event.clientY,
      ids: [],
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
        id: segment.id,
        x: Math.min(Math.max(centerX, TOOLTIP_EDGE), window.innerWidth - TOOLTIP_EDGE),
        y: rect.top,
      })

      translateSegmentFx({ from: lang, text: segment.text, to: otherLang })
        .then((translation) => {
          setTooltip((prev) =>
            prev && prev.id === segment.id ? { ...prev, status: 'done', text: translation } : prev
          )
        })
        .catch(() => {
          setTooltip((prev) =>
            prev && prev.id === segment.id ? { ...prev, status: 'error', text: '' } : prev
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
        setDragIds([])
        setTooltip(null)
        suppressClickRef.current = true
        return
      }

      drag.active = true
      drag.ids = [drag.startId]
      setDragIds([drag.startId])
      setTooltip(null)
      setTouchBlocked(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }

    const word = findWordAt(event.clientX, event.clientY)

    if (word && !drag.ids.includes(word)) {
      drag.ids.push(word)
      setDragIds([...drag.ids])
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    setDragIds([])
    clearHold()
    setTooltip(null)

    if (!drag.active) return

    setTouchBlocked(false)
    suppressClickRef.current = true

    if (drag.ids.length > 1) {
      wordsMerged(drag.ids)
    }
  }

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    setDragIds([])
    clearHold()
    setTooltip(null)
    setTouchBlocked(false)
  }

  const handleWordClick = (id: string) => {
    if (!interactive) return

    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    wordToggled(id)
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

  if (setId && !set) {
    return (
      <Box grow height="100%">
        <Header
          back
          text={welcome ? 'Задание' : 'Текст задания'}
          onBackClick={() => popScreen()}
        />
        <EmptyScreen fullHeight icon={<IconViewList fontSize={24} />} text="Задание не найдено" />
      </Box>
    )
  }

  return (
    <div className={classes.root}>
      <Header
        back
        text={
          welcome ? (set?.name ?? '') : hasAnyText ? 'Изменить текст' : 'Добавить текст'
        }
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
          {welcome ? null : (
            <ButtonIcon
              ariaLabel={hasAnyText ? 'Изменить текст' : 'Добавить текст'}
              icon={<IconEdit fontSize={24} />}
              variant="flat"
              onClick={handleEdit}
            />
          )}
        </Stack>

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
                {words.map((segment) => {
                  const checked =
                    selected.includes(segment.id) || dragIds.includes(segment.id)

                  return (
                    <Fragment key={segment.id}>
                      {segment.lineBreak ? <span className={classes.lineBreak} /> : null}
                      <button
                        aria-pressed={checked}
                        className={checked ? `${classes.word} ${classes.wordChecked}` : classes.word}
                        data-word={segment.id}
                        disabled={!interactive}
                        type="button"
                        onClick={() => handleWordClick(segment.id)}
                        onPointerDown={(event) => handleWordPointerDown(event, segment)}
                      >
                        {segment.text}
                      </button>
                    </Fragment>
                  )
                })}
              </div>
            </div>
          </TextPanel>
        ) : (
          <TextPanel grow>
            <Stack
              height="100%"
              horizontalAlign="center"
              spacing="s"
              verticalAlign="center"
            >
              <Text color="contrast-tertiary" variant="S / Medium">
                Текст ещё не заполнен
              </Text>
              {hasAnyText ? (
                <Button
                  loading={translating}
                  onClick={handleTranslate}
                >
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
