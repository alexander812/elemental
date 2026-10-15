# Курсы (экраны)

`ui/CoursesView.tsx` — корневой экран: список курсов (пара языков в скобках, число уроков, описание, полоса прогресса по пройденным урокам), выбор курса (активная плашка → вкладка «Уроки»), «Добавить курс» (sheet: «Создать новый» / «Найти готовый»), заглушка, shake-подсказки. `ui/CourseCreateView.tsx` — создание/редактирование (название, описание, язык только при создании).

Файлы: `store/index.ts` — `fetchCoursesFx`, `createCourseFx`, `updateCourseFx`, `courseSelected`, `deleteCourseFx` (режимы `with-lessons`/`course-only`), `$courses`, `$currentCourseId`, `$addedCourseId`, `addedCourseShown`.

Внешние связи: `features/lessons/store`, `features/sets/store`, `features/course-search/store`, `features/backup/store`, `features/theme/store` (языки), `features/onboarding/ui/useDelayedShake`, `features/navigation/store`, `shared/ui/InputWithVoice`, `transport/courses`.

Оркестрация: код экранов — встроенный `explore`. Контент готовых курсов — не здесь: `app/src/courses` + skill `new-course` и агент `course-editor`.

Инварианты: язык курса задаётся только при создании; язык пользователя в списке недоступен; пара (текущий язык пользователя + язык курса) закрепляется за курсом при создании/загрузке (`Course.userLang`/`Course.lang`) и при редактировании не меняется; дубликат — по уровню + названию + языку курса.
