import { combine, createEffect, createStore } from 'effector'

import { DEFAULT_COURSE_LANG } from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import * as setsApi from '../../../transport/sets'
import type { CardEditPair, CardPair, CardSet, CardTexts } from '../../../transport/sets'
import { importBackupFx } from '../../backup/store'
import { deleteCourseFx, $courses } from '../../courses/store'
import { deleteLessonFx, $lessons } from '../../lessons/store'

export const fetchSetsFx = createEffect(() => setsApi.fetchSets())

export const createSetFx = createEffect(
  (payload: { lessonId: string; name: string; cards: CardPair[]; texts?: CardTexts }) =>
    setsApi.createSet(payload)
)

export const updateSetFx = createEffect(
  (payload: {
    setId: string
    lessonId: string
    name: string
    pairs: CardEditPair[]
    texts?: CardTexts
  }) => setsApi.updateSet(payload)
)

export const setSetActiveFx = createEffect((payload: { setId: string; active: boolean }) =>
  setsApi.setSetActive(payload.setId, payload.active)
)

export const setSetSwappedFx = createEffect((payload: { setId: string; swapped: boolean }) =>
  setsApi.setSetSwapped(payload.setId, payload.swapped)
)

export const updateSetTextFx = createEffect(
  (payload: { setId: string; lang: LanguageCode; text: string }) =>
    setsApi.updateSetText(payload.setId, payload.lang, payload.text)
)

export const deleteSetFx = createEffect((setId: string) => setsApi.deleteSet(setId))

export const reorderSetsFx = createEffect((ids: string[]) => setsApi.reorderSets(ids))

export const addCardFx = createEffect((payload: { setId: string; texts: CardTexts }) =>
  setsApi.addCard(payload.setId, payload.texts)
)

export const addCardsFx = createEffect((payload: { setId: string; texts: CardTexts[] }) =>
  setsApi.addCards(payload.setId, payload.texts)
)

export const updateCardFx = createEffect(
  (payload: { setId: string; cardId: string; texts: CardTexts }) =>
    setsApi.updateCard(payload.setId, payload.cardId, payload.texts)
)

export const updateCardChecksFx = createEffect(
  (payload: {
    setId: string
    cardId: string
    checks: { voiceCheck?: boolean | null; writeCheck?: boolean | null }
  }) => setsApi.updateCardChecks(payload.setId, payload.cardId, payload.checks)
)

export const setCardLearnedFx = createEffect(
  (payload: { setId: string; cardId: string; learned: boolean }) =>
    setsApi.setCardLearned(payload.setId, payload.cardId, payload.learned)
)

export const deleteCardFx = createEffect((payload: { setId: string; cardId: string }) =>
  setsApi.deleteCard(payload.setId, payload.cardId)
)

export const deleteCardsFx = createEffect((payload: { setId: string; learned: boolean }) =>
  setsApi.deleteCards(payload.setId, payload.learned)
)

export const restoreCardsFx = createEffect((payload: { setId: string; cardIds: string[] }) =>
  setsApi.restoreCards(payload.setId, payload.cardIds)
)

export const resetSetFx = createEffect((setId: string) => setsApi.resetSet(setId))

export const $sets = createStore<CardSet[]>([])
  .on(
    [
      fetchSetsFx.doneData,
      updateSetFx.doneData,
      setSetActiveFx.doneData,
      setSetSwappedFx.doneData,
      updateSetTextFx.doneData,
      deleteSetFx.doneData,
      reorderSetsFx.doneData,
      addCardFx.doneData,
      addCardsFx.doneData,
      updateCardFx.doneData,
      updateCardChecksFx.doneData,
      setCardLearnedFx.doneData,
      deleteCardFx.doneData,
      deleteCardsFx.doneData,
      restoreCardsFx.doneData,
      resetSetFx.doneData,
    ],
    (_, sets) => sets
  )
  .on(createSetFx.doneData, (_, { sets }) => sets)
  .on(deleteLessonFx.doneData, (_, { sets }) => sets)
  .on(deleteCourseFx.doneData, (_, { sets }) => sets)
  .on(importBackupFx.doneData, (_, { sets }) => sets)

export const $courseLangByLesson = combine($lessons, $courses, (lessons, courses) => {
  const langByCourse = new Map(courses.map((course) => [course.id, course.lang]))

  return new Map(
    lessons.map((lesson) => [lesson.id, langByCourse.get(lesson.courseId) ?? DEFAULT_COURSE_LANG])
  )
})

export const $setsLoading = createStore(false)
  .on(fetchSetsFx, () => true)
  .on(fetchSetsFx.finally, () => false)

export const $setsLoaded = createStore(false).on(fetchSetsFx.finally, () => true)

export const $setsError = createStore<string | null>(null)
  .on(fetchSetsFx.failData, (_, err) => (err instanceof Error ? err.message : String(err)))
  .reset(fetchSetsFx)
