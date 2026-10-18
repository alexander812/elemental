import { useMemo, useState } from 'react'
import type {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
} from 'react'

import { FormattedMessage, useIntl } from 'react-intl'
import type { MessageDescriptor } from 'react-intl'

import {
  IconCheck,
  IconClose,
  IconEdit,
  IconKeyboard,
  IconMicrophone,
  IconRefresh,
  IconSound,
  IconTrash,
} from '@elemental/icons'
import { Stack, Text } from '@elemental/ui-kit'

import type { LanguageCode } from '../../../../../../lib/languages'
import { canRecognize } from '../../../../../../transport/recognition'
import { canSpeak } from '../../../../../../transport/speech'

import classes from './FlashCard.module.pcss'

const LISTENING_HINTS: Record<string, MessageDescriptor> = {
  en: { id: 'cards_listening_hint_en', defaultMessage: 'Speak in English' },
  es: { id: 'cards_listening_hint_es', defaultMessage: 'Speak in Spanish' },
  fr: { id: 'cards_listening_hint_fr', defaultMessage: 'Speak in French' },
  ru: { id: 'cards_listening_hint_ru', defaultMessage: 'Speak in Russian' },
}

const defaultListeningHint: MessageDescriptor = {
  id: 'cards_listening_hint',
  defaultMessage: 'speak now',
}

export type Leaving = {
  id: string
  x: number
  y: number
  rotate: number
  action: 'learned' | 'later' | 'delete'
}

export type DragPos = {
  x: number
  y: number
  startX: number
  startY: number
  pointerId: number
}

export type CheckStatus = {
  kind: 'success' | 'error'
  message: string
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

const noop = (): void => undefined

export type FlashCardProps = {
  asrProgress: number | null
  backText: string
  checkStatus: CheckStatus | null
  counter?: { current: number; total: number } | undefined
  depth: number
  drag: DragPos | null
  flipped: boolean
  frontText: string
  interactive: boolean
  language: LanguageCode
  leaving: Leaving | null
  listening: boolean
  micFlash: 'error' | 'success' | null
  onEdit?: () => void
  onFlip?: () => void
  onPointerCancel?: () => void
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSpeakBack?: () => void
  onSpeakFront?: () => void
  onVoiceCheck: () => void
  onWriteCheck?: (value: string) => void
  testMode: boolean
  voiceCheckEnabled: boolean
  writeCheck: boolean | null
  writeCheckEnabled: boolean
  writeCheckFallback?: boolean
  writePlaceholder: string
}

export function FlashCard({
  asrProgress,
  backText,
  checkStatus,
  counter,
  depth,
  drag,
  flipped,
  frontText,
  interactive,
  language,
  leaving,
  listening,
  micFlash,
  onEdit = noop,
  onFlip = noop,
  onPointerCancel = noop,
  onPointerDown = noop,
  onPointerMove = noop,
  onPointerUp = noop,
  onSpeakBack = noop,
  onSpeakFront = noop,
  onVoiceCheck,
  onWriteCheck = noop,
  testMode,
  voiceCheckEnabled,
  writeCheck,
  writeCheckEnabled,
  writeCheckFallback = false,
  writePlaceholder,
}: FlashCardProps) {
  const isTop = depth === 0
  const intl = useIntl()

  const [writeOpen, setWriteOpen] = useState(false)
  const [writeDismissed, setWriteDismissed] = useState(false)
  const [writeValue, setWriteValue] = useState('')

  const showWriteCheck = writeCheckEnabled || writeCheckFallback
  const fallbackActive = showWriteCheck && writeCheckFallback && !writeDismissed

  if (!showWriteCheck && writeOpen) {
    setWriteOpen(false)
    setWriteValue('')
  }

  const writeActive = (writeOpen && showWriteCheck) || fallbackActive

  const badgeOpacity = (value: number) => clamp01(value)

  const baseTransform = useMemo(() => {
    if (leaving) {
      return `translate(${leaving.x}px, ${leaving.y}px) rotate(${leaving.rotate}deg)`
    }

    if (drag && isTop) {
      const rotate = drag.x / 24
      return `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`
    }

    return `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`
  }, [leaving, drag, isTop, depth])

  const wrapperStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: baseTransform,
    transition: drag
      ? 'none'
      : leaving
        ? 'transform 260ms ease-in, opacity 260ms ease-in'
        : 'transform 200ms ease',
    opacity: leaving ? 0 : 1,
    zIndex: 100 - depth,
    pointerEvents: interactive && !leaving ? 'auto' : 'none',
    touchAction: testMode ? 'auto' : 'none',
  }

  const flipStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 400ms ease',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }

  const faceStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 20,
    boxShadow: '0 12px 32px 0 rgb(0, 0, 0, 24%)',
    overflow: 'hidden',
  }

  const leftBadgeOpacity = drag && isTop ? badgeOpacity(-drag.x / 80) : 0
  const rightBadgeOpacity = drag && isTop ? badgeOpacity(drag.x / 80) : 0
  const upBadgeOpacity = drag && isTop ? badgeOpacity(-drag.y / 80) : 0

  const badgeStyle = (side: 'left' | 'right' | 'up'): CSSProperties => ({
    position: 'absolute',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    border: '2px solid currentColor',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 700,
    transition: 'opacity 80ms linear',
    pointerEvents: 'none',
    ...(side === 'left'
      ? {
          top: 24,
          left: 24,
          transform: 'rotate(-12deg)',
          color: 'var(--positive-text-and-icons)',
          opacity: leftBadgeOpacity,
        }
      : side === 'right'
        ? {
            top: 24,
            right: 24,
            transform: 'rotate(12deg)',
            color: 'var(--warning-text-and-icons)',
            opacity: rightBadgeOpacity,
          }
        : {
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--negative-text-and-icons)',
            opacity: upBadgeOpacity,
          }),
  })

  const showActions = isTop && !leaving && interactive
  const showVoiceCheck = voiceCheckEnabled && canRecognize()

  const actionButton = (label: string, icon: ReactElement, onClick: () => void) => (
    <button
      aria-label={label}
      className={classes.actionButton}
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {icon}
    </button>
  )

  const cardActions = (onSpeak: () => void) => (
    <div className={classes.cardActions}>
      {actionButton(
        intl.formatMessage({ id: 'cards_edit', defaultMessage: 'Edit' }),
        <IconEdit fontSize={24} />,
        onEdit
      )}
      {canSpeak()
        ? actionButton(
            intl.formatMessage({ id: 'cards_card_speak', defaultMessage: 'Speak' }),
            <IconSound fontSize={24} />,
            onSpeak
          )
        : null}
    </div>
  )

  const checkStateClass = (state: boolean | null) =>
    state === true
      ? classes.checkButtonSuccess
      : state === false
        ? classes.checkButtonFailure
        : classes.checkButtonIdle

  const handleWriteSubmit = (event: FormEvent) => {
    event.preventDefault()

    const value = writeValue.trim()

    if (!value) return

    setWriteOpen(false)
    setWriteDismissed(true)
    setWriteValue('')
    onWriteCheck(value)
  }

  const handleWriteCancel = () => {
    setWriteOpen(false)
    setWriteDismissed(true)
    setWriteValue('')
  }

  const statusMessage = checkStatus ? (
    <div className={classes.message}>
      <Text align="center" color="contrast-primary" variant="S / Medium">
        {checkStatus.message}
      </Text>
    </div>
  ) : null

  const listeningHint = listening ? (
    <Text align="center" color="inherit" variant="S / Medium">
      {asrProgress !== null ? (
        intl.formatMessage(
          { id: 'cards_asr_loading', defaultMessage: 'Loading speech recognition… {progress}%' },
          { progress: Math.round(asrProgress * 100) }
        )
      ) : (
        <>
          {intl.formatMessage(LISTENING_HINTS[language] ?? defaultListeningHint)}
          <span className={classes.listeningDots}>
            <span className={classes.listeningDot}>.</span>
            <span className={classes.listeningDot}>.</span>
            <span className={classes.listeningDot}>.</span>
          </span>
        </>
      )}
    </Text>
  ) : null

  const cardCounter = counter ? (
    <div className={classes.counter}>
      <Text align="center" color="contrast-secondary" variant="M / Medium">
        {counter.current} / {counter.total}
      </Text>
    </div>
  ) : null

  const checkControls = (
    <Stack spacing="s" horizontalAlign="center">
      <div className={classes.messageSlot}>{statusMessage}</div>
      {writeActive ? (
        <form
          className={classes.checkForm}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onSubmit={handleWriteSubmit}
        >
          <input
            autoFocus
            className={classes.checkInput}
            enterKeyHint="done"
            inputMode="text"
            placeholder={writePlaceholder}
            type="text"
            value={writeValue}
            onChange={(event) => setWriteValue(event.target.value)}
          />
          <button
            aria-label={intl.formatMessage({ id: 'common_ok', defaultMessage: 'OK' })}
            className={`${classes.checkButton} ${
              writeValue.trim() ? classes.checkButtonSuccess : classes.checkButtonIdle
            }`}
            disabled={!writeValue.trim()}
            type="submit"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <IconCheck fontSize={24} />
          </button>
          <button
            aria-label={intl.formatMessage({ id: 'common_cancel', defaultMessage: 'Cancel' })}
            className={`${classes.checkButton} ${classes.checkButtonIdle}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleWriteCancel()
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <IconClose fontSize={24} />
          </button>
        </form>
      ) : (
        <div className={classes.cardChecks}>
          {showVoiceCheck ? (
            <button
              aria-label={
                listening
                  ? intl.formatMessage({
                      id: 'cards_check_stop_recording',
                      defaultMessage: 'Stop recording',
                    })
                  : intl.formatMessage({
                      id: 'cards_check_pronunciation',
                      defaultMessage: 'Check pronunciation',
                    })
              }
              className={`${classes.checkButton} ${
                listening
                  ? classes.checkButtonListening
                  : micFlash === 'success'
                    ? classes.checkButtonSuccess
                    : micFlash === 'error'
                      ? classes.checkButtonFailure
                      : classes.checkButtonIdle
              } ${listening ? classes.checkButtonPulse : ''}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onVoiceCheck()
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <IconMicrophone fontSize={24} />
            </button>
          ) : null}
          {showWriteCheck ? (
            <button
              aria-label={intl.formatMessage({
                id: 'cards_check_typing',
                defaultMessage: 'Check typing',
              })}
              className={`${classes.checkButton} ${checkStateClass(writeCheck)}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setWriteValue('')
                setWriteDismissed(false)
                setWriteOpen(true)
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <IconKeyboard fontSize={24} />
            </button>
          ) : null}
        </div>
      )}
      <div className={classes.hintSlot}>{listeningHint}</div>
    </Stack>
  )

  return (
    <div
      style={wrapperStyle}
      onPointerDown={testMode ? undefined : onPointerDown}
      onPointerMove={testMode ? undefined : onPointerMove}
      onPointerUp={testMode ? undefined : onPointerUp}
      onPointerCancel={testMode ? undefined : onPointerCancel}
    >
      <div
        style={{ width: '100%', height: '100%', perspective: 1200 }}
        onClick={isTop && !testMode ? onFlip : undefined}
      >
        <div style={flipStyle}>
          <div
            style={{
              ...faceStyle,
              background: 'var(--accent-bg-default)',
              color: 'var(--accent-over)',
              transform: 'rotateY(0deg)',
            }}
          >
            <Stack spacing="l" horizontalAlign="center" verticalAlign="center">
              <Text align="center" variant="XL / Medium">
                {frontText}
              </Text>
              {showActions ? checkControls : null}
            </Stack>
            {cardCounter}
            {showActions && !testMode ? cardActions(onSpeakFront) : null}
          </div>
          <div
            style={{
              ...faceStyle,
              background: 'var(--surface-elevation-1)',
              color: 'var(--contrast-primary)',
              border: '1px solid var(--contrast-quaternary)',
              transform: 'rotateY(180deg)',
            }}
          >
            <Stack spacing="s" horizontalAlign="center" verticalAlign="center">
              <Text align="center" color="contrast-secondary" variant="XS / Medium">
                {frontText}
              </Text>
              <Text align="center" variant="L / Medium">
                {backText}
              </Text>
            </Stack>
            {cardCounter}
            {showActions && !testMode ? cardActions(onSpeakBack) : null}
          </div>
        </div>
        {isTop && !leaving && !testMode && (
          <>
            <div style={badgeStyle('left')}>
              <IconCheck fontSize={20} />{' '}
              <FormattedMessage id="cards_swipe_learned" defaultMessage="learned" />
            </div>
            <div style={badgeStyle('right')}>
              <IconRefresh fontSize={20} />{' '}
              <FormattedMessage id="cards_swipe_later" defaultMessage="later" />
            </div>
            <div style={badgeStyle('up')}>
              <IconTrash fontSize={20} />{' '}
              <FormattedMessage id="cards_swipe_delete" defaultMessage="delete" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
