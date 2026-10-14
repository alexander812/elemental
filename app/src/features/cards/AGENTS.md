# Карточки и тест

Экран `cards` — колода и тест одного задания; редактор слова — в `features/card-create`.

Файлы:
- `ui/CardsView/index.tsx` — режимы (изучение/тест), общая механика (анимация ухода, micFlash, listening, pointer-свайпы), результаты.
- `ui/CardsView/components/LearnMode` — колода, свайпы, фильтры (`FilterBar`), `useLearnChecks.ts` (микрофон/ввод, `learnAfterChecks`, фолбэк на клавиатуру), `SwipeHints`, `LearnFinish`.
- `ui/CardsView/components/TestMode` — очередь теста, вердикты, авторежим, сохранение `examPassed`/`learned`, дебаг-сообщения.
- `ui/CardsView/components/FlashCard` — карточка: флип (CSS 3D), pointer-свайпы (порог 110px), вибрация, счётчик «N / M», кнопки проверок и озвучки.
- `ui/CardsView/helpers.ts` — общие хелперы; `store/index.ts` — `speakFx`, `$speakFailed`, `recognizeFx`, `cancelRecognizeFx`, `$pronunciation`, `$recognizeFailed`.
- `ui/CardsRestoreView.tsx` — восстановление удалённых карточек.

Внешние связи: `lib/checks.ts`, `lib/pronunciation.ts`, `lib/recognitionErrors.ts`, `lib/cards.ts`, `lib/sounds.ts`, `shared/ui/ExamResults`, `shared/ui/Confetti`, `shared/ui/RecognitionSheet` (`ensureAsrReadyFx`), `features/sets/store`, `features/theme/store` (checks, debugMode), `features/navigation/store`, `transport/speech`, `transport/recognition`, `transport/haptics`, `transport/wakeLock`.

Оркестрация: разбор нескольких файлов или незнакомого кода — сначала субагент `cards-explorer`; правка одного файла — без него.

Инварианты:
- `learned`/`deleted` — мягкие: удалённые не показываются в колоде и счётчиках, восстанавливаются.
- Проверки (микрофон/ввод) — только на лицевой стороне и на языке курса; `learnAfterChecks` переносит в выученные через 2 с после успеха.
- Тест проверяет только произношение; первый же ответ снимает «пройдено» (`examPassed`).
