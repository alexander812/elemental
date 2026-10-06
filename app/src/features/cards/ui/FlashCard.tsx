import { useMemo, useState } from 'react'
import type {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
} from 'react'

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
import { FormHelperText, Stack, Text } from '@elemental/ui-kit'

import { canRecognize } from '../../../transport/recognition'
import { canSpeak } from '../../../transport/speech'

import classes from './FlashCard.module.pcss'

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
  dots?: boolean
  kind: 'listening' | 'success' | 'error'
  message: string
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

export type FlashCardProps = {
  backText: string
  checkStatus: CheckStatus | null
  depth: number
  drag: DragPos | null
  flipped: boolean
  frontText: string
  interactive: boolean
  leaving: Leaving | null
  onEdit: () => void
  onFlip: () => void
  onPointerCancel: () => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSpeakBack: () => void
  onSpeakFront: () => void
  onVoiceCheck: () => void
  onWriteCheck: (value: string) => void
  recognizing: boolean
  voiceCheck: boolean | null
  writeCheck: boolean | null
}

export function FlashCard({
  backText,
  checkStatus,
  depth,
  drag,
  flipped,
  frontText,
  interactive,
  leaving,
  onEdit,
  onFlip,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSpeakBack,
  onSpeakFront,
  onVoiceCheck,
  onWriteCheck,
  recognizing,
  voiceCheck,
  writeCheck,
}: FlashCardProps) {
  const isTop = depth === 0

  const [writeOpen, setWriteOpen] = useState(false)
  const [writeValue, setWriteValue] = useState('')

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
    touchAction: 'none',
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

  const actionButton = (
    label: string,
    icon: ReactElement,
    onClick: () => void,
    state?: { active?: boolean; disabled?: boolean }
  ) => (
    <button
      aria-label={label}
      className={`${classes.actionButton} ${state?.active ? classes.actionButtonActive : ''}`}
      disabled={state?.disabled}
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
      {actionButton('Изменить', <IconEdit fontSize={24} />, onEdit)}
      {canSpeak() ? actionButton('Озвучить', <IconSound fontSize={24} />, onSpeak) : null}
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
    setWriteValue('')
    onWriteCheck(value)
  }

  const handleWriteCancel = () => {
    setWriteOpen(false)
    setWriteValue('')
  }

  const statusHelper = checkStatus ? (
    checkStatus.kind === 'listening' ? (
      <Text align="center" color="inherit" variant="S / Medium">
        {checkStatus.message}
        {checkStatus.dots ? (
          <span className={classes.listeningDots}>
            <span className={classes.listeningDot}>.</span>
            <span className={classes.listeningDot}>.</span>
            <span className={classes.listeningDot}>.</span>
          </span>
        ) : null}
      </Text>
    ) : (
      <FormHelperText
        rounded
        variant={checkStatus.kind === 'success' ? 'success' : 'error'}
      >
        {checkStatus.message}
      </FormHelperText>
    )
  ) : null

  const checkControls = (
    <Stack spacing="s" horizontalAlign="center">
      {writeOpen ? (
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
            placeholder="Перевод"
            type="text"
            value={writeValue}
            onChange={(event) => setWriteValue(event.target.value)}
          />
          <button
            aria-label="ОК"
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
            aria-label="Отмена"
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
          {canRecognize() ? (
            <button
              aria-label={recognizing ? 'Остановить запись' : 'Проверить произношение'}
              className={`${classes.checkButton} ${
                recognizing && voiceCheck === null
                  ? classes.checkButtonListening
                  : checkStateClass(voiceCheck)
              } ${recognizing ? classes.checkButtonPulse : ''}`}
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
          <button
            aria-label="Проверить ввод текста"
            className={`${classes.checkButton} ${checkStateClass(writeCheck)}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setWriteValue('')
              setWriteOpen(true)
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <IconKeyboard fontSize={24} />
          </button>
        </div>
      )}
      {statusHelper}
    </Stack>
  )

  return (
    <div
      style={wrapperStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        style={{ width: '100%', height: '100%', perspective: 1200 }}
        onClick={isTop ? onFlip : undefined}
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
            {showActions ? cardActions(onSpeakFront) : null}
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
              {statusHelper}
            </Stack>
            {showActions ? cardActions(onSpeakBack) : null}
          </div>
        </div>
        {isTop && !leaving && (
          <>
            <div style={badgeStyle('left')}>
              <IconCheck fontSize={20} /> выучено
            </div>
            <div style={badgeStyle('right')}>
              <IconRefresh fontSize={20} /> позже
            </div>
            <div style={badgeStyle('up')}>
              <IconTrash fontSize={20} /> удалить
            </div>
          </>
        )}
      </div>
    </div>
  )
}
