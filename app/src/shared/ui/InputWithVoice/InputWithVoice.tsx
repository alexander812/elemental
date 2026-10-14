import { useRef, useState } from 'react'
import type { FocusEvent } from 'react'

import { useIntl } from 'react-intl'

import { IconMicrophone, IconTranslate } from '@elemental/icons'

import { InputText, Stack } from '@elemental/ui-kit'
import type { InputTextProps } from '@elemental/ui-kit'

import type { LanguageCode } from '../../../lib/languages'
import { recognizeErrorDescriptor } from '../../../lib/recognitionErrors'
import { canRecognize, cancelRecognition, recognize } from '../../../transport/recognition'
import { ensureAsrReadyFx } from '../RecognitionSheet'

import classes from './InputWithVoice.module.pcss'

export type InputWithVoiceProps = Omit<InputTextProps, 'endIcon' | 'onChange' | 'value'> & {
  canTranslate?: boolean
  lang: LanguageCode
  onChange: (value: string) => void
  onTranslate?: () => void
  translating?: boolean
  value: string
}

const isRecognizeCancelled = (error: unknown) =>
  error instanceof Error && (error.message === 'cancelled' || error.message === 'aborted')

export function InputWithVoice({
  canTranslate,
  lang,
  value,
  onChange,
  onTranslate,
  translating,
  ...rest
}: InputWithVoiceProps) {
  const intl = useIntl()
  const [focused, setFocused] = useState(false)
  const [listening, setListening] = useState(false)
  const [recognizeFailed, setRecognizeFailed] = useState<Error | null>(null)

  const sessionRef = useRef(0)

  const handleRecognize = async () => {
    if (rest.disabled) return

    if (listening) {
      sessionRef.current += 1
      cancelRecognition()
      setListening(false)
      setRecognizeFailed(null)
      return
    }

    sessionRef.current += 1
    const session = sessionRef.current

    setRecognizeFailed(null)

    const ready = await ensureAsrReadyFx(lang)

    if (sessionRef.current !== session || !ready) return

    setListening(true)

    try {
      const result = await recognize(lang)
      const text = result.transcript.trim()

      if (sessionRef.current !== session) return

      if (text) {
        onChange(text)
      }
    } catch (error) {
      if (sessionRef.current !== session || isRecognizeCancelled(error)) return

      setRecognizeFailed(error instanceof Error ? error : new Error('recognition_failed'))
    } finally {
      if (sessionRef.current === session) setListening(false)
    }
  }

  const microphone =
    focused && canRecognize() ? (
      <button
        aria-label={
          listening
            ? intl.formatMessage({
                id: 'input_voice_stop_dictation',
                defaultMessage: 'Stop dictation',
              })
            : intl.formatMessage({
                id: 'input_voice_start_dictation',
                defaultMessage: 'Dictate',
              })
        }
        className={`${classes.mic} ${listening ? classes.micActive : ''}`}
        disabled={rest.disabled}
        type="button"
        onClick={handleRecognize}
        onPointerDown={(event) => event.preventDefault()}
      >
        <IconMicrophone fontSize={20} />
      </button>
    ) : null

  const translate =
    focused && onTranslate ? (
      <button
        aria-label={intl.formatMessage({
          id: 'input_voice_translate',
          defaultMessage: 'Translate',
        })}
        className={`${classes.mic} ${translating ? classes.translateBusy : ''}`}
        disabled={rest.disabled || translating || !(canTranslate ?? value.trim().length > 0)}
        type="button"
        onClick={onTranslate}
        onPointerDown={(event) => event.preventDefault()}
      >
        <IconTranslate fontSize={20} />
      </button>
    ) : null

  const handleFocus = () => setFocused(true)

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return

    setFocused(false)
  }

  const endIcon =
    translate || microphone ? (
      <Stack direction="row" shrink={0} spacing="xs" verticalAlign="center">
        {translate}
        {microphone}
      </Stack>
    ) : null

  return (
    <div
      className={`${classes.wrapper} ${rest.fullWidth ? classes.wrapperFullWidth : ''}`}
      onBlur={handleBlur}
      onFocus={handleFocus}
    >
      <InputText
        {...rest}
        endIcon={endIcon}
        error={
          recognizeFailed
            ? intl.formatMessage(recognizeErrorDescriptor(recognizeFailed))
            : rest.error
        }
        helperText={recognizeFailed ? undefined : rest.helperText}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
