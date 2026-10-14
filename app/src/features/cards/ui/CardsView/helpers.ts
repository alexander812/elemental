import type { IntlShape, MessageDescriptor } from 'react-intl'

import type { LanguageCode } from '../../../../lib/languages'
import type { CardSet } from '../../../../lib/types'
import type { Screen } from '../../../navigation/store'

export const DECK_DEPTH = 3
export const LEAVE_MS = 260
export const MIC_FLASH_MS = 2000
export const VOICE_FALLBACK_HINT: MessageDescriptor = {
  id: 'cards_check_voice_fallback',
  defaultMessage: "Couldn't recognize. Type the word instead.",
}
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

const SPEAK_ERRORS: Record<string, MessageDescriptor> = {
  language_not_supported: {
    id: 'cards_speak_language_not_supported',
    defaultMessage: 'No voice for this language',
  },
  speech_unavailable: {
    id: 'cards_speak_unavailable',
    defaultMessage: 'Audio playback is unavailable on this device',
  },
  voice_missing: {
    id: 'cards_speak_voice_missing',
    defaultMessage: 'Download a voice in Settings → Voices',
  },
  unknown_method: {
    id: 'errors_update_app',
    defaultMessage: 'Update the app',
  },
}

export const speakErrorText = (intl: IntlShape, error: Error): string =>
  intl.formatMessage(
    SPEAK_ERRORS[error.message] ?? {
      id: 'cards_speak_failed',
      defaultMessage: "Couldn't play the audio",
    }
  )

export const modelRecognitionText = (intl: IntlShape, candidates: string[]): string =>
  candidates.length > 0
    ? intl.formatMessage(
        {
          id: 'cards_debug_model_recognized',
          defaultMessage: 'Model recognized: {candidates}',
        },
        { candidates: candidates.map((candidate) => `"${candidate}"`).join(', ') }
      )
    : intl.formatMessage({
        id: 'cards_debug_model_nothing',
        defaultMessage: 'The model recognized nothing',
      })
