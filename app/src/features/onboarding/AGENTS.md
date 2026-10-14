# Онбординг

`ui/OnboardingView.tsx` — полноэкранный экран поверх приложения (проп `variant`: `general` | `task`): эмблема, печатающийся текст, проявляющиеся кнопки «Смотреть видео» (открывает `knowledge` с `GENERAL_VIDEO_ID` для `general` и `TASK_VIDEO_ID` для `task`) и «Открыть базу знаний», крестик. `general` — первый запуск, `task` — первое открытие задания (экраны `set-intro`/`cards`). `ui/useShakeHint.ts` / `ui/useDelayedShake.ts` — подсказки-shake (`shake.module.pcss`).

Файлы: `store/index.ts` — флаги `completed`/`hints` в `app.onboarding` (`$onboardingOpened`, `$onboardingHints`, `onboardingCompleted`, `hintShown`, тип `OnboardingHint`) и флаг `completed` в `app.task-onboarding` (`$taskOnboardingOpened`, `taskOnboardingCompleted`).

Внешние связи: `lib/storage.ts` (ключи `app.onboarding`, `app.task-onboarding`), `features/navigation/store`, `features/knowledge/videos.ts` (`GENERAL_VIDEO_ID`, `TASK_VIDEO_ID`). Интеграция — `layouts/AppLayout.tsx` (`$appReady`, `$onboardingOpened`, `$taskOnboardingOpened`, экраны `set-intro`/`cards`).

Скилл: `new-onboarding` — канон фичи (UI + state в одной папке, печать текста, подсказки, валидатор); загружать для любых задач по онбордингу.

Инварианты: подсказки показываются один раз и помечаются в `app.onboarding`; пока онбординг открыт, он не пропускает взаимодействие с приложением; каждый вариант показывается один раз по своему ключу, `task` — только после `general` (`!onboardingOpened`).
