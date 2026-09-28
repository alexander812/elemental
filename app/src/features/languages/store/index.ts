import { createEffect, createStore } from 'effector';

import type { Language } from '../../../lib/languages';
import * as languagesApi from '../../../transport/languages';
import { fetchSettings } from '../../../transport/settings';
import { removeCardsWithLanguage } from '../../../transport/sets';
import { importBackupFx } from '../../backup/store';

export const fetchLanguagesFx = createEffect(() => languagesApi.fetchLanguages());

export const addLanguageFx = createEffect((code: string) => languagesApi.addLanguage(code));

export const deleteLanguageFx = createEffect(async (code: string) => {
  const settings = await fetchSettings();

  if (settings.originalLang === code || settings.translationLang === code) {
    throw new Error('Язык выбран в настройках');
  }

  const sets = await removeCardsWithLanguage(code);
  const languages = await languagesApi.removeLanguage(code);

  return { languages, sets };
});

export const $languages = createStore<Language[]>([])
  .on(fetchLanguagesFx.doneData, (_, languages) => languages)
  .on(addLanguageFx.doneData, (_, languages) => languages)
  .on(deleteLanguageFx.doneData, (_, { languages }) => languages)
  .on(importBackupFx.doneData, (_, { languages }) => languages);

export const $languagesLoading = createStore(false)
  .on(fetchLanguagesFx, () => true)
  .on(fetchLanguagesFx.finally, () => false);
