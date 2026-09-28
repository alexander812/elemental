import { createEffect, createStore } from 'effector';

import type { LanguageCode } from '../../../lib/languages';
import * as settingsApi from '../../../transport/settings';
import type { Settings, ThemeName } from '../../../transport/settings';
import { importBackupFx } from '../../backup/store';

export const fetchSettingsFx = createEffect(() => settingsApi.fetchSettings());

export const setThemeFx = createEffect((theme: ThemeName) => settingsApi.saveTheme(theme));

export const setLanguagesFx = createEffect(
  (payload: { originalLang: LanguageCode; translationLang: LanguageCode }) =>
    settingsApi.saveLanguages(payload.originalLang, payload.translationLang),
);

export const $settings = createStore<Settings>(settingsApi.DEFAULT_SETTINGS)
  .on(fetchSettingsFx.doneData, (_, settings) => settings)
  .on(setThemeFx.doneData, (_, settings) => settings)
  .on(setLanguagesFx.doneData, (_, settings) => settings)
  .on(importBackupFx.doneData, (_, { settings }) => settings);

export const $theme = $settings.map((settings) => settings.theme);
export const $originalLang = $settings.map((settings) => settings.originalLang);
export const $translationLang = $settings.map((settings) => settings.translationLang);

export const $settingsLoading = createStore(true).on(fetchSettingsFx.finally, () => false);
