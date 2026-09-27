import { createEffect, createStore } from 'effector';

import type { LanguageCode } from '../../../lib/languages';
import * as setsApi from '../../../transport/sets';
import type { CardSet } from '../../../transport/sets';

export const fetchSetsFx = createEffect(() => setsApi.fetchSets());

export const createSetFx = createEffect((name: string) => setsApi.createSet(name));

export const setSetActiveFx = createEffect((payload: { setId: string; active: boolean }) =>
  setsApi.setSetActive(payload.setId, payload.active),
);

export const reorderSetsFx = createEffect((ids: string[]) => setsApi.reorderSets(ids));

export const addCardFx = createEffect(
  (payload: {
    setId: string;
    original: string;
    translation: string;
    originalLang: LanguageCode;
    translationLang: LanguageCode;
  }) =>
    setsApi.addCard(payload.setId, {
      [payload.originalLang]: payload.original,
      [payload.translationLang]: payload.translation,
    }),
);

export const setCardLearnedFx = createEffect(
  (payload: { setId: string; cardId: string; learned: boolean }) =>
    setsApi.setCardLearned(payload.setId, payload.cardId, payload.learned),
);

export const deleteCardFx = createEffect((payload: { setId: string; cardId: string }) =>
  setsApi.deleteCard(payload.setId, payload.cardId),
);

export const deleteCardsFx = createEffect((payload: { setId: string; learned: boolean }) =>
  setsApi.deleteCards(payload.setId, payload.learned),
);

export const restoreCardsFx = createEffect((payload: { setId: string; cardIds: string[] }) =>
  setsApi.restoreCards(payload.setId, payload.cardIds),
);

export const $sets = createStore<CardSet[]>([])
  .on(
    [
      fetchSetsFx.doneData,
      createSetFx.doneData,
      setSetActiveFx.doneData,
      reorderSetsFx.doneData,
      addCardFx.doneData,
      setCardLearnedFx.doneData,
      deleteCardFx.doneData,
      deleteCardsFx.doneData,
      restoreCardsFx.doneData,
    ],
    (_, sets) => sets,
  );

export const $setsLoading = createStore(false)
  .on(fetchSetsFx, () => true)
  .on(fetchSetsFx.finally, () => false);

export const $setsError = createStore<string | null>(null)
  .on(fetchSetsFx.failData, (_, err) => (err instanceof Error ? err.message : String(err)))
  .reset(fetchSetsFx);
