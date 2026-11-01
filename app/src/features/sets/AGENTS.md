# Урок: задания (список)

Экран `lesson{lessonId}` — задания урока: `ui/SetsView/index.tsx` (список, свайпы, перетаскивание, счётчики, галочка теста, полоса прогресса по выученным карточкам), `ui/SetsView/components/SetRow`, `ui/SetMenu.tsx` — общее меню «…» (используется и на экранах карточек и текста задания).

Файлы: `store/index.ts` — `fetchSetsFx`, `createSetFx`/`updateSetFx`, `setSetActiveFx`, `setSetSwappedFx`, `setSetExamPassedFx`, `updateSetTextFx`, `deleteSetFx`, `reorderSetsFx`, `addCardFx`/`addCardsFx`/`updateCardFx`/`updateCardChecksFx`, `setCardLearnedFx`, `deleteCardFx`/`deleteCardsFx`/`restoreCardsFx`, `resetSetFx`, `$sets`, `$courseLangByLesson`, `$userLangByLesson` (пара языков курса по уроку).

Внешние связи: `features/lessons/store`, `features/courses/store`, `features/course-search/store` (сборка готовых курсов), `features/backup/store`, `features/navigation/store`, `shared/ui/SwipeRow` (+ `useRowReorder`), `transport/sets`.

Оркестрация: разбор нескольких файлов — сначала субагент `sets-explorer`.

Инварианты: задание принадлежит уроку; удаление урока каскадом удаляет задания; `resetSet` сохраняет тексты и id, сбрасывает карточки и `examPassed`.

Полиглот: задания с `phraseTask` без карточек открываются прямо в учебных страницах, их полоса показывает решённые вопросы. Категории упражнений с `cards` + `phraseTask` открывают обычные карточки; полоса/счётчики — выученные слова, галочка — итоговый фразовый тест. Существующие карточки категорий не перезаписываются при синхронизации поставляемого контента.

`restartPhraseTaskFx` / `transport/sets.restartPhraseTask` возвращают к первой странице и сбрасывают только solved/examPassed, сохраняя learned/deleted/checks карточек. Общий `resetSetFx` по-прежнему сбрасывает всё задание вместе с карточками.

`transport/sets.readSets/writeSets` используют `ready-content`: свой контент сохраняется целиком, для готового курса — только sparse patches прогресса и пользовательских правок относительно RAM baseline. Boot `fetchSets` не импортирует Полиглот и не загружает контент. `ensureReadyCourseFx.doneData` обновляет `$sets` после загрузки.

Полиглот загружает полный контент только при запуске урока через `ensureReadyLessonFx` (его doneData обновляет `$sets`). До этого в RAM находятся оболочки заданий с метаданными и сохранённым завершением; их карточные/фразовые patches остаются в ready-state до загрузки базового контента.
