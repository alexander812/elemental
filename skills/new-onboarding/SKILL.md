---
name: new-onboarding
description: Делает онбординг в Lexi — полноэкранный экран знакомства (печатающийся текст, плавно проявляющиеся кнопки, крестик, переходы в видео и базу знаний), флаги в app.onboarding и подсказки-shake; описывает канон features/onboarding (UI + state в одной папке), интеграцию в AppLayout и проверку валидатором. Use when просят создать/добавить/обновить онбординг или приветственный экран, «онбординг», «знакомство с приложением», «приветствие при первом запуске», «покажи приветствие», "new onboarding", "welcome screen", "intro screen", "first launch", "onboarding hints".
---

# Новый онбординг

## Контекст (прочитать перед работой)

- Канон — `app/src/features/onboarding/`: `store/index.ts` (состояние и флаги) и `ui/` (`OnboardingView.tsx` + `OnboardingView.module.pcss`, `useShakeHint.ts`, `useDelayedShake.ts`, `shake.module.pcss`). UI и state — в одной папке фичи.
- Показ — `app/src/layouts/AppLayout.tsx`: `{appReady && onboardingOpened ? <OnboardingView /> : null}` внутри `BottomSheetProvider` (после футера и `Toast`); `$appReady` — в `features/boot/store`.
- Хранение — ключ `app.onboarding` (`{ completed, hints }` в конверте `{ version, data }` через `lib/storage`); производные `$onboardingOpened = !completed`, `$onboardingHints`.
- Экран `knowledge` принимает `videoId?: string` и сразу открывает плеер с нужным роликом (`features/knowledge/videos.ts: GENERAL_VIDEO_ID`).
- `PROJECT.md` → «Экраны и функционал» («Онбординг», «База знаний»), «Архитектура приложения» (`features/onboarding/`), «Проверка изменений».
- Шаблон e2e — `$TMPDIR/opencode/e2e/onboarding.cjs` (вне репозитория, не коммитится).

## Поведение (контракт, который проверяем)

- Полноэкранный оверлей при первом запуске; пока открыт — не пропускает взаимодействие с приложением.
- Крестик в правом верхнем углу, внизу — 1–2 кнопки действий («Смотреть видео», «Открыть базу знаний»).
- Сначала посимвольно печатается заголовок и описание, затем кнопки плавно проявляются (`opacity` 0 → 1, до появления — `pointer-events: none`).
- Закрытие — крестик или любая кнопка; после — `completed = true`, второй раз не показывается (пока не сброшены данные).
- Подсказки-shake показываются один раз; их флаги — в `hints` того же стора.

## Шаги

1. **Сценарий.** Решить, когда показывать (первый запуск — ключ `onboarding`; первый вход в фичу — отдельный ключ `app.<name>`) и что на экране: заголовок до ~40 знаков (2 строки), описание 2–4 строки, 1–2 кнопки. Новый экран по умолчанию не плодит второй оверлей — расширяй существующий `OnboardingView`.
2. **State.** В `store/index.ts`: `{ completed: boolean, hints: Record<HintName, boolean> }`; чтение при инициализации через `load`/`save`, события `*Completed` и `hintShown`, производные `$*Opened`/`$*Hints`. Ключ — `app.<name>`. Новый ключ не требует подъёма `DATA_VERSION`; подъём стирает флаги, и онбординг показывается снова (помнить, не «чинить»). Если флаг должен переживать версии данных — хранить его в `Settings` (тогда `DATA_VERSION` + `BACKUP_VERSION`).
3. **UI.** Оверлей: `position: absolute; inset: 0; z-index: 900` (+ отступы `env(safe-area-inset-*)`) — ниже портала bottom sheet (`z-index: 1000`), поверх футера. Контент — `Stack grow verticalAlign="start"`: лого, заголовок и описание сверху, кнопки внизу. Под печатающиеся блоки зарезервировать высоту (XL — 2 строки = 72px, M — 4 строки = 96px), иначе перенос заголовка двигает лого и кнопки. Печать — цепочка `setTimeout` по 1 символу (40 мс): `setState` в теле эффекта запрещён правилом `react-hooks/set-state-in-effect`. Каретка мигает только пока печатается; при `prefers-reduced-motion` текст показывается сразу, без transition. Кнопки — `.actions` (`opacity: 0; pointer-events: none`) → `.actionsVisible` (`opacity: 1`).
4. **Рендер.** В `AppLayout` — только после готовности данных (`$appReady`), иначе печать стартует под boot-splash.
5. **Кнопки.** Действия — `pushScreen(...)`; для общего видео — `pushScreen({ name: 'knowledge', videoId: GENERAL_VIDEO_ID })`. «Дребезг» кликов после навигации гасится сам (`lib/ghostClick.ts`).
6. **Подсказки.** Переиспользовать `useShakeHint(hint, active)` и `useDelayedShake(active, delayMs, onFinished)` из `features/onboarding/ui`, свой CSS не копировать. Новые имена добавить в `OnboardingHint`. Флаг ставится по `animationend` (с таймаут-фолбэком для reduced motion), а не в теле эффекта.
7. **Видео-скил.** `skills/new-video/engine/runner.cjs` проставляет `app.onboarding` (completed + все подсказки), чтобы ролики снимались без онбординга. Для нового ключа добавить сид рядом — иначе ролики снимутся с оверлеем.
8. **Документация.** `PROJECT.md`: дерево `features/`, пункт «Онбординг», ключ в списке localStorage, сценарий в «Проверка изменений».

## Валидация

```bash
node skills/new-onboarding/scripts/validate-onboarding.mjs             # канон features/onboarding
node skills/new-onboarding/scripts/validate-onboarding.mjs cards-intro # другая фича
ONBOARDING_KEY=cards-intro node skills/new-onboarding/scripts/validate-onboarding.mjs cards-intro
```

Скрипт проверяет: `store/index.ts` и `ui/*.tsx` на месте; ключ и флаг `completed` в store; чтение/запись через `load`/`save` из `lib/storage`; импорт фичи и привязку к `$appReady` в `AppLayout`; оверлей `position: absolute; inset: 0` с `z-index < 1000`; `prefers-reduced-motion`. Предупреждения: нет сида `app.onboarding` в `runner.cjs`, нет упоминания в `PROJECT.md`, нет общих shake-хуков при наличии `hints`. Ошибки — код 1, только предупреждения — код 0.

## Проверка после добавления

1. `node skills/new-onboarding/scripts/validate-onboarding.mjs`
2. `npm run lint`, `npm run typecheck`, `npm run build` (корень).
3. e2e (Playwright + CDP, скрипты в `$TMPDIR/opencode/e2e`, не коммитятся; шаблон — `onboarding.cjs`): свежий localStorage → онбординг виден, текст печатается, до конца печати кнопки `opacity: 0`, после — `1`; координаты лого/заголовка/кнопок не меняются во время печати (сравнить `getBoundingClientRect` в начале, после переноса заголовка и после появления кнопок); крестик скрывает и пишет `completed`; перезагрузка — не показывается; кнопки ведут в «Базу знаний» (общий ролик открывается сразу в плеере); подсказки-shake срабатывают один раз. Сиды в localStorage — в конверте `{ version: <DATA_VERSION из app/src/lib/storage.ts>, data }`.
4. Ручной взгляд: тёмная и светлая темы, узкий экран (~320px), `prefers-reduced-motion`.

## Частые ошибки

- **Джиттер при печати**: вертикальное центрирование и/или отсутствие резерва высот — перенос заголовка на вторую строку двигает лого и кнопки. Лечится верхним выравниванием (`verticalAlign="start"`) и `min-height` под максимум строк.
- **`setState` в теле эффекта** — линтер (`react-hooks/set-state-in-effect`) валит сборку; печать и срабатывание подсказок делаются таймерами, флаг подсказки — по `animationend`.
- **Кнопки кликабельны, пока невидимы** — без `pointer-events: none` ловят тапы раньше времени.
- **Рендер до `$appReady`** — печать уходит под boot-splash.
- **`animationend` от детей** — проверять `event.target === event.currentTarget`, иначе подсказка закрывается чужой анимацией.
- **Подъём `DATA_VERSION` «ради онбординга»** — сбрасывает данные всем; новому ключу это не нужно.
- **Свой shake/pcss вместо общих хуков** — расходится анимация и правило «один раз».
- **Забыт сид в `runner.cjs`** — видеоинструкции снимаются с онбордингом поверх.
- **`pushScreen({ name: 'knowledge' })` без `videoId`** — открывается список, а не общий ролик.
