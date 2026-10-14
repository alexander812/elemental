# Онбординг первого запуска

`ui/OnboardingView.tsx` — полноэкранный экран поверх приложения: эмблема, печатающийся текст, проявляющиеся кнопки «Смотреть видео» (открывает `knowledge` с `GENERAL_VIDEO_ID`) и «Открыть базу знаний», крестик. `ui/useShakeHint.ts` / `ui/useDelayedShake.ts` — подсказки-shake (`shake.module.pcss`).

Файлы: `store/index.ts` — флаги `completed`/`hints` в `app.onboarding`, `$onboardingOpened`, `$onboardingHints`, `onboardingCompleted`, `hintShown`, тип `OnboardingHint`.

Внешние связи: `lib/storage.ts` (ключ `app.onboarding`), `features/navigation/store`, `features/knowledge/videos.ts`. Интеграция — `layouts/AppLayout.tsx`.

Скилл: `new-onboarding` — канон фичи (UI + state в одной папке, печать текста, подсказки, валидатор); загружать для любых задач по онбордингу.

Инварианты: подсказки показываются один раз и помечаются в `app.onboarding`; пока онбординг открыт, он не пропускает взаимодействие с приложением.
