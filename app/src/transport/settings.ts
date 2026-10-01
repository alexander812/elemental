import { DEFAULT_ORIGINAL_LANG, DEFAULT_TRANSLATION_LANG } from '../lib/languages';
import type { LanguageCode } from '../lib/languages';
import { load, save } from '../lib/storage';
import type { Settings, ThemeName } from '../lib/types';

export type { Settings, ThemeName } from '../lib/types';
export type { LanguageCode } from '../lib/languages';

const SETTINGS_KEY = 'settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  originalLang: DEFAULT_ORIGINAL_LANG,
  translationLang: DEFAULT_TRANSLATION_LANG,
};

export function readSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export async function fetchSettings(): Promise<Settings> {
  return readSettings();
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const settings = { ...(await fetchSettings()), ...patch };
  save<Settings>(SETTINGS_KEY, settings);
  return settings;
}

export async function saveTheme(theme: ThemeName): Promise<Settings> {
  return saveSettings({ theme });
}

export async function saveLanguages(
  originalLang: LanguageCode,
  translationLang: LanguageCode,
): Promise<Settings> {
  return saveSettings({ originalLang, translationLang });
}
