import { DEFAULT_USER_LANG } from '../lib/languages'
import type { LanguageCode } from '../lib/languages'
import { load, save } from '../lib/storage'
import type { Settings, ThemeName } from '../lib/types'

export type { Settings, ThemeName } from '../lib/types'

const SETTINGS_KEY = 'settings'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  userLang: DEFAULT_USER_LANG,
  learnAfterChecks: false,
}

type StoredSettings = Partial<Settings>

const THEMES: ThemeName[] = ['dark', 'light', 'terracotta', 'midnight', 'stone', 'amethyst']

export function readSettings(): Settings {
  const raw = load<StoredSettings>(SETTINGS_KEY, {})

  return {
    theme: THEMES.includes(raw.theme as ThemeName) ? (raw.theme as ThemeName) : 'dark',
    userLang: typeof raw.userLang === 'string' && raw.userLang ? raw.userLang : DEFAULT_USER_LANG,
    learnAfterChecks: raw.learnAfterChecks === true,
  }
}

export async function fetchSettings(): Promise<Settings> {
  return readSettings()
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const settings = { ...(await fetchSettings()), ...patch }
  save<Settings>(SETTINGS_KEY, settings)
  return settings
}

export async function saveTheme(theme: ThemeName): Promise<Settings> {
  return saveSettings({ theme })
}

export async function saveUserLang(userLang: LanguageCode): Promise<Settings> {
  return saveSettings({ userLang })
}

export async function saveLearnAfterChecks(learnAfterChecks: boolean): Promise<Settings> {
  return saveSettings({ learnAfterChecks })
}
