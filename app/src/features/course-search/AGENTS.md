# Поиск готовых курсов

`ui/CourseSearchView.tsx` — селекты уровня и языка (bottom sheet; уровень по умолчанию Beginner, остальные уровни неактивны), список карточек с чекбоксами, «Загрузить» (sticky), `ConfirmSheet` замены дубликатов.

Файлы: `store/index.ts` — `levelSelected`, `languageSelected`, `courseToggled`, `duplicatesCancelled`, `screenOpened`, `fetchCatalogFx` (загрузка JSON каталога; при открытии экрана сразу грузится Beginner), `loadCoursesFx` + `buildReadyCourses` (сборка курсов, уроков, заданий и карточек из пары языковых файлов), `$catalog`, `$selected`, `$duplicates`, `$level`, `$language`.

Внешние связи: `transport/catalog.ts` (`import.meta.glob`), `transport/courses.ts`, `features/lessons/store`, `features/sets/store`, `features/courses/store`, `features/theme/store`, `shared/ui/ConfirmSheet`, `shared/ui/Toast`, `lib/languages.ts`.

Оркестрация: код — встроенный `explore`. Контент и каталоги уровней (`app/src/courses/*.json`, `courses_<level>.json`) — skill `new-course` + агент `course-editor`.

Инварианты: карточки собираются попарно по индексу слов из двух языковых файлов; дубликат — по уровню + названию + языку курса; замена каскадно удаляет старые уроки и задания.
