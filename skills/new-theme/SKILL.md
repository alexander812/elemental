---
name: new-theme
description: Добавляет новую цветовую тему в Lexi (набор токенов в colors.json, типы ThemeName, выбор в настройках, boot-скрипт, Storybook) из готовой палитры и проверяет её валидатором. Use when просят создать/добавить тему, новую цветовую схему, перекрасить приложение, «новая тема», «добавь тему», «сделай тему», «другая палитра», "add theme", "new theme", "color scheme", "palette".
---

# Новая цветовая тема

## Контекст (прочитать перед работой)

- `design-system/ui-kit/src/tokens/colors.json` — единственный источник тем: объект `{ "dark": {...}, "light": {...}, "terracotta": {...} }`. У каждой темы ~66 логических токенов, у каждого — двойник `<token>-rgb` со строкой каналов `R, G, B`.
- `ThemeProvider` (`design-system/ui-kit/src/ThemeProvider/ThemeProvider.tsx`) читает JSON в рантайме (`colors[themeName]`), ставит CSS-переменные на `document.body` и `data-theme`; `isLight` вычисляется из `surface-canvas`.
- `tokens.css` и `src/tokens/types.ts` генерирует `npm run generate-tokens` из темы `dark` (+ corners + fonts). При добавлении темы с тем же набором ключей перегенерация не нужна.
- `-rgb`-двойники нужны компонентам, собирающим rgba (`rgb(var(--contrast-tertiary-rgb), 25%)` в `internal/typography`), и IDE-автокомплиту — держать в синхроне с базовым значением.
- Выбор темы — Radio на экране `app/src/features/settings/ui/ThemeView.tsx`, хранение — `Settings.theme` (`app.settings` через `app/src/transport/settings.ts`), применение — `app/src/ThemeRoot.tsx`.
- Фон до загрузки приложения красит inline-скрипт в `app/index.html` (читает `app.settings` из конверта `{ version, data }`).
- `PROJECT.md` → «Модель данных» (`Settings`), «Экраны и функционал» («Тема»), «Дизайн-система» (список тем в токенах).

## Чеклист (все точки, которые надо тронуть)

1. `design-system/ui-kit/src/tokens/colors.json` — добавить ключ темы, скопировав структуру и порядок ключей соседней темы (например `light`).
2. `design-system/ui-kit/src/tokens/index.ts` — расширить локальный `type Theme = 'dark' | ...` (иначе `tsc` падает: `colors as Record<Theme, Tokens>` не проходит).
3. `design-system/ui-kit/src/ThemeProvider/types.ts` — расширить `ThemeName`.
4. `design-system/ui-kit/.storybook/addons/theme-switcher/shared.ts` — пункт `{ value: '<key>', title: '<Title>', right: '<key>' }` для превью в Storybook.
5. `app/src/lib/types.ts` — расширить `ThemeName`.
6. `app/src/transport/settings.ts` — в `readSettings()` пропускать новый ключ (`raw.theme === 'light' || raw.theme === '<key>' ? raw.theme : 'dark'`), иначе после перезагрузки тема откатится на тёмную.
7. `app/src/features/settings/ui/ThemeView.tsx` — `<Radio.Option label="<Подпись>" value="<key>" />`.
8. `app/index.html` — ветка в boot-скрипте: `if (parsed.data.theme === '<key>') canvas = '<surface-canvas в hex>'` (без неё при загрузке мигнёт тёмный фон). `DATA_VERSION` в литерале держать синхронным с `app/src/lib/storage.ts`.
9. `PROJECT.md` — `Settings.theme`, строка экрана «Тема», перечисление тем у токенов.

`DATA_VERSION` не поднимать: формат localStorage не менялся, старые значения `dark`/`light` остаются валидными.

## Как разложить палитру по токенам

Из палитры обычно есть: фон, поверхность, текст, акцент и 1–2 семантических цвета. Роли и альфы берём из соседней темы, меняем только базовые цвета.

| Токены | Смысл | Как выбрать |
|---|---|---|
| `surface-canvas` | фон приложения | основной цвет фона палитры |
| `surface-elevation-1/2/3` | карточки и шиты, панели, границы-разделители | 1 — самая светлая (почти белый для светлой темы), 2 — на шаг темнее, 3 — ещё темнее (в `terracotta`: `#FFFDF8` / `#FDF8EC` / `#F2E7D0`) |
| `shadow-elevation-0..3` | тени | равны `surface-elevation-3` (так во всех существующих темах) |
| `contrast-primary` | основной текст | цвет текста палитры; `secondary`/`tertiary`/`quaternary` — он же с альфами 0.6 / 0.3 / 0.07 |
| `accent-bg-default/hover/active` | кнопки, активные табы, акцентные карточки | акцент палитры, hover светлее, active темнее |
| `accent-over` | текст и иконки на акценте | кремовый/белый для светлых тем, тёмный — для тёмных |
| `accent-text-and-icons` | акцентный текст/иконки на canvas | тот же акцент (можно на шаг светлее/темнее — как в `light`) |
| `accent-transparent` | мягкая акцентная плашка | акцент с альфой 0.15 |
| `warning-*` | предупреждения, крестик «не выучено» | второй цвет палитры по той же схеме: `bg-*`, `over` (контрастный текст на фоне), `text-and-icons` (затемнённый вариант для текста на canvas), `transparent` — 0.15 |
| `positive-*`, `negative-*` | успех/ошибка, проверки | копировать из соседней темы — семантические цвета между темами не меняются |
| `input-*`, `card-*`, `control-*` | поля, карточки, чипы, кнопки | `*-bg-default` — поверхность темы, `hover`/`active`/`inactive` — базовый цвет с альфами как в соседней теме; `input-border` 0.25, `card-border` 0.1, `control-border` 0.02 |
| `surface-overlay` | затемнение под bottom sheet | цвет текста с альфой 0.4 |
| `const-*`, `chart-lines-*` | константы графиков и метрик | копировать из светлой темы |

Ориентиры контраста (замерены на текущих темах): основной текст на canvas ≥ 12:1, `accent-over` на `accent-bg-default` ≥ 3.5:1 (у negative-кнопок в системе ~3.5), warning-текст на canvas ≥ 3:1, вторичный текст ~4:1. Отдельно смотреть элементы на акцентных карточках (чипы счётчиков в списке заданий, иконки): canvas-токены там могут слиться с акцентом — в приложении для контента на акценте есть `Chip color="onAccent"` и `var(--accent-over)`.

Пример (тема `terracotta`): canvas `#FCF4E4`, текст `#281B10` (40, 27, 16), акцент `#C66930` (hover `#D5793F`, active `#A8541F`), `accent-over` `#FFFDF8`, warning `#EAB163`, warning-текст `#9C6420`.

## Валидация

```bash
node skills/new-theme/scripts/validate-theme.mjs terracotta   # одна тема
node skills/new-theme/scripts/validate-theme.mjs --all        # все темы
TOKENS_FILE=... node skills/new-theme/scripts/validate-theme.mjs --all  # свой colors.json
```

Скрипт проверяет: одинаковый набор ключей у всех тем (эталон — `dark`); формат значений `rgb()/rgba()`; наличие и совпадение каналов у `-rgb`-двойников; упоминание ключа в `ThemeName` (ui-kit и app), `tokens/index.ts`, `transport/settings.ts`, `ThemeView.tsx`, Storybook-переключателе; boot-ветку в `index.html` и совпадение её hex с `surface-canvas` темы. Ошибки — выходной код 1, предупреждения (Storybook, PROJECT.md) — код 0.

## Проверка после добавления

1. `node skills/new-theme/scripts/validate-theme.mjs --all`
2. `npm run lint`, `npm run typecheck`, `npm run build` (корень).
3. Визуальный прогон (Playwright + CDP, скрипты в temp, как в PROJECT.md): засеять `app.settings` конвертом `{ version: 4, data: { theme: '<key>' } }`, открыть экран «Тема», список уроков, список заданий (акцентная карточка), экран карточек (лицо и оборот), меню «…» (bottom sheet) — проверить `data-theme` на `body`, отсутствие ошибок в консоли.
4. Boot без вспышки: заблокировать `**/assets/index-*.js` через Playwright route, открыть страницу и проверить, что `--boot-canvas` (и фон `html`) равен `surface-canvas` новой темы.

## Частые ошибки

- Забыт `-rgb`-двойник или каналы не совпадают с базовым значением — компоненты с `rgb(var(--x-rgb), …)` показывают чужой цвет.
- Не расширен локальный `Theme` в `tokens/index.ts` — ошибка `TS2352` на `colors as Record<Theme, Tokens>`.
- Не обновлён `readSettings()` — тема работает до перезагрузки, потом молча сбрасывается на тёмную.
- Нет boot-ветки в `index.html` — при загрузке в светлой теме мигает тёмный фон.
- Набор ключей новой темы отличается от остальных — падение `ThemeProvider`/сборки; сверяться валидатором.
- Хардкод hex в компонентах вместо токенов — тема не подхватится.
- Крестики/чипы/иконки на акцентных карточках сливаются с фоном — использовать `Chip color="onAccent"`/`accent-over` и проверять контраст на реальных экранах, а не только на canvas.
