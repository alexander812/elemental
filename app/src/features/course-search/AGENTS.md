# Поиск готовых курсов

`ui/CourseSearchView.tsx` — раздел «Полиглот» с карточкой «Полиглот English» и раздел «Языковые тренажёры» с селектами уровня и языка (bottom sheet; Beginner по умолчанию, Elementary доступен), карточки с чекбоксами, общая «Загрузить» (sticky), `ConfirmSheet` замены дубликатов. `CourseSearchCard` задаёт одинаковый вид карточек обоих разделов.

Файлы: `store/index.ts` — `levelSelected`, `languageSelected`, `courseToggled`, `duplicatesCancelled`, `screenOpened`, `fetchCatalogFx` (загрузка JSON каталога; при открытии экрана сразу грузится Beginner), `loadCoursesFx` + `buildReadyCourses` (сборка курсов, уроков, заданий и карточек из пары языковых файлов), `$catalog`, `$selected`, `$duplicates`, `$level`, `$language`.

Внешние связи: `transport/catalog.ts` (`import.meta.glob`), `transport/poliglot.ts`, `courses/poliglot/course_poliglot.en.json`, `transport/courses.ts`, `features/lessons/store`, `features/sets/store`, `features/courses/store`, `features/theme/store`, `shared/ui/ConfirmSheet`, `shared/ui/Toast`, `lib/languages.ts`.

Оркестрация: код — встроенный `explore`. Контент и каталоги уровней (`app/src/courses/*.json`, `courses_<level>.json`) — skill `new-course` + агент `course-editor`.

Инварианты: карточки собираются попарно по индексу слов из двух языковых файлов; дубликат — по уровню + названию + языку курса; замена каскадно удаляет старые уроки и задания.

Полиглот всегда ru → en и не зависит от фильтров тренажёров. Его ключ выбора — `poliglot:en`; смена уровня сохраняет этот выбор. `loadCoursesFx` сначала проверяет дубликаты тренажёров (до подтверждения ничего не пишет), затем сохраняет тренажёры и загружает выбранный Полиглот через transport. Повторный Полиглот сохраняет прогресс. Полные массивы результата общей загрузки обновляют stores курсов, уроков и заданий.
