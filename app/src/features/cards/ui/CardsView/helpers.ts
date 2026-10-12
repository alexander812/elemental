import type { LanguageCode } from '../../../../lib/languages'
import type { CardSet } from '../../../../lib/types'
import type { Screen } from '../../../navigation/store'

export const DECK_DEPTH = 3
export const LEAVE_MS = 260
export const MIC_FLASH_MS = 2000
export const VOICE_FALLBACK_HINT = 'Не удалось распознать. Введите слово с клавиатуры.'
export const VOICE_FALLBACK_ATTEMPTS = 2

export const findNextSet = (sets: CardSet[], set: CardSet): CardSet | undefined =>
  sets
    .filter(
      (item) =>
        item.active &&
        item.id !== set.id &&
        item.lessonId === set.lessonId &&
        item.order > set.order
    )
    .sort((a, b) => a.order - b.order)[0]

export const nextSetScreen = (set: CardSet, courseLang: LanguageCode): Screen =>
  (set.texts[courseLang] ?? '').trim().length > 0
    ? { name: 'set-intro', setId: set.id }
    : { name: 'cards', setId: set.id }

const SPEAK_ERRORS: Record<string, string> = {
  language_not_supported: 'Нет голоса для этого языка',
  speech_unavailable: 'Озвучка недоступна на устройстве',
  voice_missing: 'Скачайте голос в Настройки → Озвучка',
  unknown_method: 'Обновите приложение',
}

export const speakErrorText = (error: Error) => SPEAK_ERRORS[error.message] ?? 'Не удалось озвучить'

export const modelRecognitionText = (candidates: string[]): string =>
  candidates.length > 0
    ? `Модель распознала: ${candidates.map((candidate) => `"${candidate}"`).join(', ')}`
    : 'Модель ничего не распознала'
