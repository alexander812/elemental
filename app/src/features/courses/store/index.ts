import { createEffect, createEvent, createStore } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import * as coursesApi from '../../../transport/courses'
import type { Course } from '../../../transport/courses'
import * as lessonsApi from '../../../transport/lessons'
import * as setsApi from '../../../transport/sets'
import { importBackupFx } from '../../backup/store'

export const fetchCoursesFx = createEffect(() => coursesApi.fetchCourses())

export const createCourseFx = createEffect(
  (payload: { name: string; description: string; lang: LanguageCode }) =>
    coursesApi.createCourse(payload)
)

export const updateCourseFx = createEffect(
  (payload: { courseId: string; name: string; description: string; lang: LanguageCode }) =>
    coursesApi.updateCourse(payload)
)

export const courseSelected = createEvent<string>()

export type DeleteCourseMode = 'with-lessons' | 'course-only'

export const deleteCourseFx = createEffect(
  async (payload: { courseId: string; baseCourseId: string; mode: DeleteCourseMode }) => {
    const courses = await coursesApi.deleteCourse(payload.courseId)
    const allLessons = await lessonsApi.fetchLessons()

    if (payload.mode === 'with-lessons') {
      const removedIds = allLessons
        .filter((lesson) => lesson.courseId === payload.courseId)
        .map((lesson) => lesson.id)
      const lessons = await lessonsApi.replaceLessons(
        allLessons.filter((lesson) => lesson.courseId !== payload.courseId)
      )
      const sets = await setsApi.deleteSetsByLessonIds(removedIds)

      return { courses, lessons, sets }
    }

    const lessons = await lessonsApi.replaceLessons(
      allLessons.map((lesson) =>
        lesson.courseId === payload.courseId
          ? { ...lesson, courseId: payload.baseCourseId }
          : lesson
      )
    )
    const sets = await setsApi.fetchSets()

    return { courses, lessons, sets }
  }
)

const resolveCurrent = (current: string | null, courses: Course[]): string | null =>
  current && courses.some((course) => course.id === current)
    ? current
    : (courses[0]?.id ?? null)

export const $courses = createStore<Course[]>([])
  .on([fetchCoursesFx.doneData, updateCourseFx.doneData], (_, courses) => courses)
  .on(createCourseFx.doneData, (_, { courses }) => courses)
  .on(deleteCourseFx.doneData, (_, { courses }) => courses)
  .on(importBackupFx.doneData, (_, { courses }) => courses)

export const $currentCourseId = createStore<string | null>(null)
  .on(courseSelected, (_, courseId) => courseId)
  .on([fetchCoursesFx.doneData, updateCourseFx.doneData], (current, courses) =>
    resolveCurrent(current, courses)
  )
  .on(createCourseFx.doneData, (current, { courses }) => resolveCurrent(current, courses))
  .on(deleteCourseFx.doneData, (current, { courses }) => resolveCurrent(current, courses))
  .on(importBackupFx.doneData, (current, { courses }) => resolveCurrent(current, courses))

export const $coursesLoading = createStore(false)
  .on(fetchCoursesFx, () => true)
  .on(fetchCoursesFx.finally, () => false)

export const $coursesLoaded = createStore(false).on(fetchCoursesFx.finally, () => true)

export const $coursesError = createStore<string | null>(null)
  .on(fetchCoursesFx.failData, (_, err) => (err instanceof Error ? err.message : String(err)))
  .reset(fetchCoursesFx)
