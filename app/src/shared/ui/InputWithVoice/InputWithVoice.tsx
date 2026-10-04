import { useEffect, useRef, useState } from 'react'
import type { FocusEvent } from 'react'

import { IconMicrophone } from '@elemental/icons'

import { InputText } from '@elemental/ui-kit'
import type { InputTextProps } from '@elemental/ui-kit'

import type { LanguageCode } from '../../../lib/languages'
import { canRecognize, cancelRecognition, recognize } from '../../../transport/recognition'

import classes from './InputWithVoice.module.pcss'

export type InputWithVoiceProps = Omit<InputTextProps, 'endIcon' | 'onChange' | 'value'> & {
  lang: LanguageCode
  onChange: (value: string) => void
  value: string
}

const RECOGNIZE_ERRORS: Record<string, string> = {
  'audio-capture': 'Микрофон недоступен',
  'no-speech': 'Ничего не расслышали, попробуйте ещё',
  'not-allowed': 'Разрешите доступ к микрофону',
  'service-not-allowed': 'Распознавание речи недоступно',
  asr_download_failed: 'Не удалось скачать распознавание речи',
  audio_error: 'Микрофон недоступен',
  audio_unavailable: 'Микрофон недоступен',
  busy: 'Подождите, распознавание уже идёт',
  language_not_supported: 'Для этого языка офлайн-распознавание недоступно',
  network: 'Нет соединения для распознавания',
  no_speech: 'Ничего не расслышали, попробуйте ещё',
  not_available: 'Распознавание речи недоступно на устройстве',
  permission_denied: 'Разрешите доступ к микрофону',
  recognition_unavailable: 'Распознавание речи недоступно',
  timeout: 'Не удалось расслышать фразу',
  unknown_method: 'Обновите приложение',
}

const recognizeErrorText = (error: Error) =>
  RECOGNIZE_ERRORS[error.message] ?? 'Не удалось распознать речь'

const isRecognizeCancelled = (error: unknown) =>
  error instanceof Error && (error.message === 'cancelled' || error.message === 'aborted')

export function InputWithVoice({ lang, value, onChange, ...rest }: InputWithVoiceProps) {
  const [focused, setFocused] = useState(false)
  const [listening, setListening] = useState(false)
  const [recognizeFailed, setRecognizeFailed] = useState<Error | null>(null)

  const valueRef = useRef(value)
  const sessionRef = useRef(0)

  useEffect(() => {
    valueRef.current = value
  }, [value])

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

    setListening(true)
    setRecognizeFailed(null)

    try {
      const result = await recognize(lang)
      const text = result.transcript.trim()

      if (sessionRef.current !== session) return

      if (text) {
        const current = valueRef.current.trimEnd()
        onChange(current.length > 0 ? `${current} ${text}` : text)
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
        aria-label={listening ? 'Остановить диктовку' : 'Продиктовать'}
        className={`${classes.mic} ${listening ? classes.micActive : ''}`}
        disabled={rest.disabled}
        type="button"
        onClick={handleRecognize}
        onPointerDown={(event) => event.preventDefault()}
      >
        <IconMicrophone fontSize={20} />
      </button>
    ) : null

  const handleFocus = () => setFocused(true)

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return

    setFocused(false)
  }

  return (
    <div
      className={`${classes.wrapper} ${rest.fullWidth ? classes.wrapperFullWidth : ''}`}
      onBlur={handleBlur}
      onFocus={handleFocus}
    >
      <InputText
        {...rest}
        endIcon={microphone}
        error={recognizeFailed ? recognizeErrorText(recognizeFailed) : rest.error}
        helperText={recognizeFailed ? undefined : rest.helperText}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
