# Урок: задания (список)

Экран `lesson{lessonId}` — задания урока: `ui/SetsView/index.tsx` (список, свайпы, перетаскивание, счётчики, галочка теста, полоса прогресса по выученным карточкам), `ui/SetsView/components/SetRow`, `ui/SetMenu.tsx` — общее меню «…» (используется и на экранах карточек и текста задания).

Файлы: `store/index.ts` — `fetchSetsFx`, `createSetFx`/`updateSetFx`, `setSetActiveFx`, `setSetSwappedFx`, `setSetExamPassedFx`, `updateSetTextFx`, `deleteSetFx`, `reorderSetsFx`, `addCardFx`/`addCardsFx`/`updateCardFx`/`updateCardChecksFx`, `setCardLearnedFx`, `deleteCardFx`/`deleteCardsFx`/`restoreCardsFx`, `resetSetFx`, `$sets`, `$courseLangByLesson`, `$userLangByLesson` (пара языков курса по уроку).

Внешние связи: `features/lessons/store`, `features/courses/store`, `features/course-search/store` (сборка готовых курсов), `features/backup/store`, `features/navigation/store`, `shared/ui/SwipeRow` (+ `useRowReorder`), `transport/sets`.

Оркестрация: разбор нескольких файлов — сначала субагент `sets-explorer`.

Инварианты: задание принадлежит уроку; удаление урока каскадом удаляет задания; `resetSet` сохраняет тексты и id, сбрасывает карточки и `examPassed`.
