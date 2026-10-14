import { Fragment, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { Spinner, Text, TextPanel } from '@elemental/ui-kit'
import { FormattedMessage } from 'react-intl'

import type { LanguageCode } from '../../../../../../lib/languages'
import type { WordSegment } from '../../../../../../lib/words'
import { translateSegmentFx } from '../../../../store'
import { wordToggled, wordsMerged } from '../../../../../text-add/store'

import classes from '../../SetTextView.module.pcss'

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

type WordsPanelProps = {
  interactive: boolean
  lang: LanguageCode
  otherLang: LanguageCode
  selected: string[]
  words: WordSegment[]
}

export function WordsPanel({ interactive, lang, otherLang, selected, words }: WordsPanelProps) {
  const [dragIds, setDragIds] = useState<string[]>([])
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const dragRef = useRef<ChipDrag | null>(null)
  const suppressClickRef = useRef(false)
  const touchBlockerRef = useRef<((event: TouchEvent) => void) | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <>
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
              const checked = selected.includes(segment.id) || dragIds.includes(segment.id)

              if (!segment.text) {
                return (
                  <Fragment key={segment.id}>
                    {segment.lineBreak ? <span className={classes.lineBreak} /> : null}
                    <span className={classes.punctuation}>
                      {`${segment.prefix ?? ''}${segment.suffix ?? ''}`}
                    </span>
                  </Fragment>
                )
              }

              return (
                <Fragment key={segment.id}>
                  {segment.lineBreak ? <span className={classes.lineBreak} /> : null}
                  <button
                    aria-pressed={checked}
                    className={classes.word}
                    data-word={segment.id}
                    disabled={!interactive}
                    type="button"
                    onClick={() => handleWordClick(segment.id)}
                    onPointerDown={(event) => handleWordPointerDown(event, segment)}
                  >
                    {segment.prefix ? (
                      <span className={classes.punctuation}>{segment.prefix}</span>
                    ) : null}
                    <span
                      className={
                        checked ? `${classes.wordText} ${classes.wordChecked}` : classes.wordText
                      }
                    >
                      {segment.text}
                    </span>
                    {segment.suffix ? (
                      <span className={classes.punctuation}>{segment.suffix}</span>
                    ) : null}
                  </button>
                </Fragment>
              )
            })}
          </div>
        </div>
      </TextPanel>

      {tooltip ? (
        <div className={classes.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.status === 'loading' ? (
            <Spinner size="s" />
          ) : tooltip.status === 'error' ? (
            <Text color="contrast-secondary" variant="S / Medium">
              <FormattedMessage
                id="set_text_word_translate_failed"
                defaultMessage="Couldn't translate"
              />
            </Text>
          ) : (
            <Text variant="S / Medium">{tooltip.text}</Text>
          )}
        </div>
      ) : null}
    </>
  )
}
