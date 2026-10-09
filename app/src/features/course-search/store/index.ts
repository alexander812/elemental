import { createEffect, createEvent, createStore, sample } from 'effector'

import { DEFAULT_COURSE_LANG } from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import type { CourseLevel } from '../../../lib/types'
import { showToast } from '../../../shared/ui/Toast'
import * as catalogApi from '../../../transport/catalog'
import type { CatalogCourseEntry, ReadyCourses } from '../../../transport/catalog'
import { fetchCourses } from '../../../transport/courses'
import { goToRoot } from '../../navigation/store'

export const levelSelected = createEvent<CourseLevel>()
export const languageSelected = createEvent<LanguageCode>()
export const courseToggled = createEvent<string>()
export const duplicatesCancelled = createEvent()
export const screenOpened = createEvent()

export const fetchCatalogFx = createEffect((level: CourseLevel) =>
  catalogApi.fetchLevelCatalog(level)
)

export type LoadCoursesResult =
  | { status: 'duplicates'; duplicates: string[] }
  | { status: 'done'; ready: ReadyCourses }

export const loadCoursesFx = createEffect(
  async (payload: {
    entries: CatalogCourseEntry[]
    level: CourseLevel
    lang: LanguageCode
    userLang: LanguageCode
    replace: boolean
  }): Promise<LoadCoursesResult> => {
    const [ready, existing] = await Promise.all([
      catalogApi.buildReadyCourses(payload),
      fetchCourses(),
    ])
    const duplicates = catalogApi.findReadyCourseDuplicates(ready, existing, payload.level)

    if (duplicates.length > 0 && !payload.replace) {
      return { status: 'duplicates', duplicates: duplicates.map((course) => course.name) }
    }

    const applied = await catalogApi.applyReadyCourses(ready, payload.level)

    return { status: 'done', ready: applied }
  }
)

export const $level = createStore<CourseLevel | null>(null)
  .on(levelSelected, (_, level) => level)
  .reset(screenOpened)

export const $language = createStore<LanguageCode>(DEFAULT_COURSE_LANG).on(
  languageSelected,
  (_, lang) => lang
)

export const $catalog = createStore<CatalogCourseEntry[]>([])
  .on(fetchCatalogFx.doneData, (_, courses) => courses)
  .reset(levelSelected, screenOpened)

export const $catalogLoading = fetchCatalogFx.pending

export const $selected = createStore<ReadonlySet<string>>(new Set())
  .on(courseToggled, (selected, file) => {
    const next = new Set(selected)

    if (next.has(file)) {
      next.delete(file)
    } else {
      next.add(file)
    }

    return next
  })
  .reset(levelSelected, fetchCatalogFx, screenOpened)

export const $duplicates = createStore<string[] | null>(null)
  .on(loadCoursesFx.doneData, (_, result) =>
    result.status === 'duplicates' ? result.duplicates : null
  )
  .on(duplicatesCancelled, () => null)
  .reset(loadCoursesFx, screenOpened)

export const $loadPending = loadCoursesFx.pending

sample({ clock: levelSelected, target: fetchCatalogFx })

loadCoursesFx.doneData.watch((result) => {
  if (result.status !== 'done') return

  showToast('Загрузка успешно завершена')
  goToRoot()
})
