import { createEffect, createStore } from 'effector'

import * as lessonsApi from '../../../transport/lessons'
import type { Lesson } from '../../../transport/lessons'
import * as setsApi from '../../../transport/sets'
import { importBackupFx } from '../../backup/store'
import { loadCoursesFx } from '../../course-search/store'
import { deleteCourseFx } from '../../courses/store'

export const fetchLessonsFx = createEffect(() => lessonsApi.fetchLessons())

export const createLessonFx = createEffect((payload: { courseId: string; name: string }) =>
  lessonsApi.createLesson(payload)
)

export const updateLessonFx = createEffect(
  (payload: { lessonId: string; courseId: string; name: string }) =>
    lessonsApi.updateLesson(payload)
)

export const deleteLessonFx = createEffect(async (lessonId: string) => {
  const lessons = await lessonsApi.deleteLesson(lessonId)
  const sets = await setsApi.deleteSetsByLesson(lessonId)

  return { lessons, sets }
})

export const reorderLessonsFx = createEffect((ids: string[]) => lessonsApi.reorderLessons(ids))

export const $lessons = createStore<Lesson[]>([])
  .on(
    [fetchLessonsFx.doneData, updateLessonFx.doneData, reorderLessonsFx.doneData],
    (_, lessons) => lessons
  )
  .on(createLessonFx.doneData, (_, { lessons }) => lessons)
  .on(deleteLessonFx.doneData, (_, { lessons }) => lessons)
  .on(deleteCourseFx.doneData, (_, { lessons }) => lessons)
  .on(loadCoursesFx.doneData, (state, result) =>
    result.status === 'done' ? result.ready.lessons : state
  )
  .on(importBackupFx.doneData, (_, { lessons }) => lessons)

export const $lessonsLoading = createStore(false)
  .on(fetchLessonsFx, () => true)
  .on(fetchLessonsFx.finally, () => false)

export const $lessonsLoaded = createStore(false).on(fetchLessonsFx.finally, () => true)

export const $lessonsError = createStore<string | null>(null)
  .on(fetchLessonsFx.failData, (_, err) => (err instanceof Error ? err.message : String(err)))
  .reset(fetchLessonsFx)
