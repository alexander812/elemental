# Уроки (список и редактор)

`ui/LessonsView/index.tsx` — вкладка «Уроки»: шапка с меню курса (редактировать, удалить с каскадом), список уроков со свайпами и перетаскиванием, галочка «все тесты пройдены», подсказки онбординга; `ui/LessonsView/components/LessonRow`; `ui/LessonCreateView.tsx` — создание/редактирование (имя, селект курса, язык курса только для отображения).

Файлы: `store/index.ts` — `fetchLessonsFx`, `createLessonFx`, `updateLessonFx`, `deleteLessonFx` (каскад: `transport/sets.deleteSetsByLesson`), `reorderLessonsFx`, `$lessons`.

Внешние связи: `features/courses/store`, `features/sets/store`, `features/course-search/store`, `features/onboarding/ui/useShakeHint`, `features/navigation/store`, `shared/ui/SwipeRow` (+ `useRowReorder`), `shared/ui/ConfirmSheet`, `shared/ui/InputWithVoice`, `transport/lessons`.

Оркестрация: разбор нескольких файлов — субагент `sets-explorer`.

Инварианты: урок наследует язык курса и не меняет его; базовый (первый) курс не удаляется; удаление урока каскадом удаляет задания и карточки.
