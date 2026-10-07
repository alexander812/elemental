import type { LanguageCode } from '../../../lib/languages'
import { callNativeSync, isNativeBridgeAvailable } from '../../../lib/nativeBridge'
import { load, remove, save } from '../../../lib/storage'
import type { ScanTextResult } from '../../../transport/ocr'
import type { Screen } from '../../navigation/store'
import { restoreNav, $nav } from '../../navigation/store'
import type { PairDraft } from '../../set-create/store'
import {
  restoreDraft,
  $draftLessonId,
  $draftName,
  $draftOriginalLang,
  $draftPairs,
  $draftTranslationLang,
} from '../../set-create/store'
import type { WordPair } from '../../text-add/store'
import {
  restoreTextAdd,
  scanTextRecovered,
  $pairs,
  $selected,
  $step,
  $text,
  $textLang,
  $words,
} from '../../text-add/store'

export type TextAddSnapshot = {
  text: string
  step: 'input' | 'words'
  words: string[]
  selected: string[]
  textLang: LanguageCode | null
  pairs: WordPair[]
}

export type SetCreateSnapshot = {
  lessonId?: string
  name: string
  originalLang: LanguageCode
  translationLang: LanguageCode
  pairs: PairDraft[]
}

export type SessionSnapshot = {
  token: string
  nav: Screen[]
  textAdd: TextAddSnapshot
  setCreate: SetCreateSnapshot
}

const SCREEN_NAMES = new Set<Screen['name']>([
  'courses',
  'course-create',
  'lessons',
  'lesson',
  'lesson-create',
  'set-create',
  'cards',
  'card-create',
  'cards-restore',
  'text-add',
  'words-translate',
  'settings',
  'theme',
  'voices',
  'checks',
  'data',
  'export',
])

const isScreen = (value: unknown): value is Screen => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('name' in value) ||
    !SCREEN_NAMES.has((value as { name: Screen['name'] }).name)
  ) {
    return false
  }

  const screen = value as Record<string, unknown>

  switch (screen.name) {
    case 'lesson':
      return typeof screen.lessonId === 'string'
    case 'cards':
    case 'card-create':
    case 'cards-restore':
    case 'words-translate':
      return typeof screen.setId === 'string'
    case 'text-add':
      return typeof screen.setId === 'string' || typeof screen.draft === 'object'
    default:
      return true
  }
}

export const saveSession = (): void => {
  if (!isNativeBridgeAvailable()) return

  save<SessionSnapshot>('session', {
    token: callNativeSync<string>('sessionToken') ?? '',
    nav: $nav.getState().stack,
    textAdd: {
      text: $text.getState(),
      step: $step.getState(),
      words: $words.getState(),
      selected: $selected.getState(),
      textLang: $textLang.getState(),
      pairs: $pairs.getState(),
    },
    setCreate: {
      lessonId: $draftLessonId.getState(),
      name: $draftName.getState(),
      originalLang: $draftOriginalLang.getState(),
      translationLang: $draftTranslationLang.getState(),
      pairs: $draftPairs.getState(),
    },
  })
}

export const loadSession = (): SessionSnapshot | null => {
  if (!isNativeBridgeAvailable()) return null

  const snapshot = load<SessionSnapshot | null>('session', null)

  if (!snapshot || !Array.isArray(snapshot.nav) || snapshot.nav.length === 0) return null
  if (!snapshot.nav.every(isScreen)) return null

  return snapshot
}

export const clearSession = (): void => remove('session')

export const restoreSession = (snapshot: SessionSnapshot): void => {
  restoreNav(snapshot.nav)

  if (snapshot.textAdd) restoreTextAdd(snapshot.textAdd)
  if (snapshot.setCreate) restoreDraft(snapshot.setCreate)
}

export const consumePendingScan = (): void => {
  if (!isNativeBridgeAvailable()) return
  if (!callNativeSync<boolean>('isScanPending')) return

  const timer = window.setInterval(() => {
    const raw = callNativeSync<string>('consumeScanResult')

    if (raw) {
      window.clearInterval(timer)

      try {
        scanTextRecovered(JSON.parse(raw) as { ok: boolean; data?: ScanTextResult; error?: string })
      } catch {
        scanTextRecovered({ ok: false, error: 'invalid_payload' })
      }

      return
    }

    if (!callNativeSync<boolean>('isScanPending')) {
      window.clearInterval(timer)
    }
  }, 300)
}

export const installSessionPersistence = (): void => {
  if (!isNativeBridgeAvailable()) return

  const persist = () => saveSession()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist()
  })
  window.addEventListener('pagehide', persist)

  $nav.watch(persist)
  $text.watch(persist)
  $step.watch(persist)
  $words.watch(persist)
  $selected.watch(persist)
  $textLang.watch(persist)
  $pairs.watch(persist)
  $draftLessonId.watch(persist)
  $draftName.watch(persist)
  $draftOriginalLang.watch(persist)
  $draftTranslationLang.watch(persist)
  $draftPairs.watch(persist)
}
