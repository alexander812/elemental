import type { LanguageCode } from '../lib/languages'
import { callNative, callNativeSync, isNativeBridgeAvailable } from '../lib/nativeBridge'

import { SPEECH_LANG } from './speech'

export type RecognitionResult = {
  alternatives: string[]
  confidence: number | null
  transcript: string
}

export type AsrStatus = {
  downloading: boolean
  error: string | null
  installed: boolean
  progress: number
  sizeBytes: number
}

type BrowserAlternative = {
  confidence: number
  transcript: string
}

type BrowserResult = {
  [index: number]: BrowserAlternative
  length: number
}

type BrowserResultList = {
  [index: number]: BrowserResult
  length: number
}

type BrowserResultEvent = {
  results: BrowserResultList
}

type BrowserErrorEvent = {
  error: string
}

type BrowserRecognition = {
  abort: () => void
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onend: (() => void) | null
  onerror: ((event: BrowserErrorEvent) => void) | null
  onresult: ((event: BrowserResultEvent) => void) | null
  start: () => void
}

type BrowserRecognitionConstructor = new () => BrowserRecognition

const RECOGNITION_TIMEOUT_MS = 10000

let activeRecognition: BrowserRecognition | null = null
const cancelledRecognitions = new WeakSet<BrowserRecognition>()

const stopRecognition = (recognition: BrowserRecognition): void => {
  try {
    recognition.abort()
  } catch {
    return
  }
}

const getRecognitionConstructor = (): BrowserRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null

  const scope = window as unknown as {
    SpeechRecognition?: BrowserRecognitionConstructor
    webkitSpeechRecognition?: BrowserRecognitionConstructor
  }

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function canRecognize(): boolean {
  if (isNativeBridgeAvailable()) {
    return callNativeSync<boolean>('hasRecognition') ?? true
  }

  return Boolean(getRecognitionConstructor())
}

function recognizeInBrowser(lang: LanguageCode): Promise<RecognitionResult> {
  const Recognition = getRecognitionConstructor()

  if (!Recognition) return Promise.reject(new Error('recognition_unavailable'))

  return new Promise<RecognitionResult>((resolve, reject) => {
    const recognition = new Recognition()
    let settled = false
    let timeout: ReturnType<typeof setTimeout> | null = null

    const finish = (action: () => void) => {
      if (settled) return

      settled = true

      if (timeout) clearTimeout(timeout)

      if (activeRecognition === recognition) activeRecognition = null

      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      action()
    }

    recognition.lang = SPEECH_LANG[lang] ?? lang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onresult = (event) => {
      const result = event.results[0]

      if (!result || result.length === 0) return

      const alternatives: string[] = []

      for (let index = 0; index < result.length; index += 1) {
        alternatives.push(result[index].transcript.trim())
      }

      const first = result[0]
      const confidence =
        typeof first.confidence === 'number' && first.confidence > 0 ? first.confidence : null

      finish(() =>
        resolve({
          alternatives,
          confidence,
          transcript: first.transcript.trim(),
        })
      )
    }

    recognition.onerror = (event) => {
      const reason = cancelledRecognitions.has(recognition)
        ? 'cancelled'
        : event.error || 'recognition_failed'

      finish(() => reject(new Error(reason)))
    }

    recognition.onend = () => {
      finish(() =>
        reject(new Error(cancelledRecognitions.has(recognition) ? 'cancelled' : 'no-speech'))
      )
    }

    timeout = setTimeout(() => {
      stopRecognition(recognition)
      finish(() => reject(new Error('timeout')))
    }, RECOGNITION_TIMEOUT_MS)

    activeRecognition = recognition

    try {
      recognition.start()
    } catch (error) {
      finish(() => reject(error instanceof Error ? error : new Error('recognition_failed')))
    }
  })
}

export function cancelRecognition(): void {
  if (isNativeBridgeAvailable()) {
    callNative('cancelRecognizeSpeech', {}).catch(() => undefined)
    return
  }

  const recognition = activeRecognition

  if (!recognition) return

  activeRecognition = null
  cancelledRecognitions.add(recognition)
  stopRecognition(recognition)
}

export function fetchAsrStatus(): Promise<AsrStatus | null> {
  if (!isNativeBridgeAvailable()) return Promise.resolve(null)

  return callNative<AsrStatus>('asrStatus', {}).then((status) => status ?? null)
}

export function recognize(lang: LanguageCode): Promise<RecognitionResult> {
  if (isNativeBridgeAvailable()) {
    return callNative<RecognitionResult>('recognizeSpeech', { lang }).then(
      (result) => ({
        alternatives: Array.isArray(result?.alternatives) ? result.alternatives : [],
        confidence: typeof result?.confidence === 'number' ? result.confidence : null,
        transcript: result?.transcript ?? '',
      }),
      (error: unknown) => {
        console.warn('[recognition] native recognize failed', error)

        throw error
      }
    )
  }

  return recognizeInBrowser(lang)
}
