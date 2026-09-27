# Elemental lang — описание проекта

Мобильное веб-приложение для заучивания слов по флеш-карточкам. Монорепозиторий с собственной дизайн-системой (иконки + ui-kit). Язык интерфейса — русский.

## Репозиторий

```
app/                      # @elemental/app — само приложение
design-system/icons/      # @elemental/icons — SVG-иконки (React)
design-system/ui-kit/     # @elemental/ui-kit — компоненты, токены, темы, Storybook
skills/new-project/       # скил opencode для скаффолдинга проектов
PROJECT.md                # этот файл
```

Монорепо: npm workspaces (`["app", "design-system/*"]`) + lerna. Корневые скрипты (lerna run): `dev`, `build`, `lint`, `typecheck`, `generate-tokens`, `storybook`.

- `app`: React 19, Vite 8 (rolldown), TypeScript, Effector 23 + effector-react, CSS Modules + PostCSS (pcss), `@fontsource-variable/inter`.
- `ui-kit`: Vite 7 + Storybook 9 (`@storybook/react-vite`), `postcss-nested`, `classnames`.
- Пакеты отдаются исходниками (`main/types: ./src/index.ts`), без шага сборки.
- В корневом `package.json` явно указаны платформенные `@esbuild/darwin-x64` и `@rollup/rollup-darwin-x64` (окружение не ставит optional-зависимости) и `overrides.esbuild`.

## Команды

```bash
npm run dev            # dev-сервер приложения
npm run build          # сборка приложения (tsc -b + vite build)
npm run lint           # eslint приложения
npm run typecheck      # tsc по всем пакетам
npm run generate-tokens  # перегенерировать tokens.css/types в ui-kit
npm run storybook      # Storybook ui-kit (порт 8080)
```

Проверка прод-сборки: `cd app && npx vite build && npx vite preview --port 4173`.

## Архитектура приложения (`app/src`)

```
main.tsx                 # createRoot + installGhostClickSuppressor()
ThemeRoot.tsx            # fetchSettingsFx, ThemeProvider (root=body), IconsProvider
App.tsx                  # рендерит AppLayout
icons.tsx                # карта иконок приложения для IconsProvider
layouts/AppLayout.tsx    # стек экранов, анимации переходов, футер
features/<feature>/
  store/index.ts         # Effector: createEffect над transport, $stores на .doneData
  ui/*.tsx               # компоненты фичи
transport/*.ts           # чистые async-функции (localStorage через lib/storage)
lib/
  storage.ts             # load/save/remove, префикс ключей "app."
  types.ts               # Card, CardSet, Settings, ThemeName
  languages.ts           # LANGUAGES, LanguageCode, дефолты, getLanguageName
  ghostClick.ts          # подавитель «призрачных» кликов после тач-навигации
```

Паттерн: UI читает сторы через `useUnit`; любое действие — вызов `*Fx`; транспорт знает только пути к данным. Комментарии в коде не приняты.

## Модель данных

```ts
Card      { id, texts: { [lang]: string }, learned, deleted }
CardSet   { id, name, active, order, cards: Card[] }
Settings  { theme: 'dark' | 'light', originalLang, translationLang }
```

- Ключи localStorage: `app.sets`, `app.seeded`, `app.settings`.
- `Card.texts` — все тексты карточки по языкам, `{ ru: 'Понедельник', en: 'Monday' }`. Лицевая сторона показывает текст текущего языка оригинала, обратная — текущего языка перевода (из `Settings`), поэтому смена языков в настройках меняет стороны у всех карточек. Помощник — `lib/cards.ts: getCardText(card, lang)` (с фолбэком на любой доступный язык).
- `learned` — карточка выучена (свайп влево), `deleted` — мягко удалена (свайп вверх или «Удалить все карточки»), такие карточки не показываются в колоде и счётчиках, но восстанавливаются.
- Seed: набор «Дни недели», 7 карточек с текстами ru+en (`transport/sets.ts`).
- Миграция в `transport/sets.ts` (`migrateCard`): старые карточки (`original`/`translation` ± `originalLang`/`translationLang`) конвертируются в `texts`; у совсем старых данные меняются местами (ru↔en), `deleted: false`.
- `restoreCards(setId, cardIds)` — `deleted=false, learned=false` (возврат в невыученные).

## Языки

- Поддерживаемые: `ru` (Русский), `en` (English) — `lib/languages.ts`, список `LANGUAGES` (расширяется одной записью; при добавлении языка тексты карточек просто заполняются новым ключом `texts`).
- Дефолты: оригинал — русский, перевод — английский (`DEFAULT_ORIGINAL_LANG`, `DEFAULT_TRANSLATION_LANG`).
- Создание карточки (`CardCreateView`) пишет введённые тексты в `texts` под текущими языками оригинала/перевода из `features/theme/store`.
- Экран «Языки» (`features/settings/ui/LanguagesView.tsx`): два выпадающих списка (`Select`) — язык оригинала и язык перевода; изменения применяются только по кнопке «Применить» (`setLanguagesFx` → `transport/settings.saveLanguages`, затем возврат назад). Одинаковые языки запрещены (кнопка disabled + подсказка).

## Навигация (`features/navigation/store`)

- Состояние `$nav: { stack: Screen[], transition }`; события `pushScreen`, `popScreen`, `goToRoot`, `transitionEnded`; производные `$stack`, `$screen`, `$transition`, `$canGoBack`.
- Экраны: `sets`, `set-create`, `cards{setId}`, `card-create{setId}`, `cards-restore{setId}`, `menu`, `theme`, `languages`.
- Анимации (`AppLayout.tsx` + `AppLayout.module.pcss`): при push новый экран выезжает слева (`slide-in-left`, класс `screenEntering`); при pop уходящий экран уезжает направо оверлеем (`slide-out-right`, класс `screenExiting`, очистка по `animationend` и таймауту 400мс через `transitionEnded`). При смене экрана `main` скроллится вверх. Учитывается `prefers-reduced-motion`.
- `lib/ghostClick.ts`: после навигации включается подавление совместимых mouse-событий (mousedown/mouseup/click) без предшествующего `pointerdown` — защита от «призрачного» клика по новому экрану после тач-тапа (иначе, например, вход в набор автоматически переворачивал карточку). Suppressor «взводится» на `pushScreen`/`popScreen`/`goToRoot`.

## Экраны и функционал

- **Наборы** (`features/sets/ui/SetsView.tsx`): список активных наборов, счётчики выучено/не выучено (нули показываются), тап — открыть набор, свайп вправо — мягко удалить (корзина, подтверждение тапом), long-press и перетаскивание — порядок, «Добавить новый» — экран создания.
- **Создание набора** (`features/set-create`): имя → «Применить».
- **Карточки** (`features/cards/ui/CardsView.tsx` + `FlashCard.tsx`): колода до 3 карточек, тап — флип (CSS 3D), стороны берутся из `texts` по языкам настроек, свайпы: влево «выучено», вправо «позже», вверх «удалить» (порог 110px), подписи-подсказки жестов; фильтры «выучено/не выучено» с количеством; меню «…»: «Удалить все карточки» (мягко, по текущему фильтру), затем «Восстановить удалённые»; выпадающее меню лежит выше карточек (в ui-kit `Header` блоки шапки имеют z-index 200); пустые состояния и финалы: «Начать сначала» (когда всё просмотрено, но есть невыученные) и «Все карточки выучены» + «Перейти к следующему набору».
- **Восстановление** (`features/cards/ui/CardsRestoreView.tsx`): список удалённых карточек — слева Checkbox, справа текст на текущем языке оригинала + название языка; кнопка «Восстановить» активна при выборе; после восстановления — возврат на экран карточек, карточки снова невыученные.
- **Добавление слова** (`features/card-create`): два поля (оригинал/перевод) с языками в подписи, «Сохранить».
- **Меню** (`features/settings/ui/MenuView.tsx`): пункты «Тема» и «Языки».
- **Тема** (`features/settings/ui/ThemeView.tsx`): светлая/тёмная.
- **Футер** (`AppLayout.tsx`): «Наборы» (goToRoot), «Меню» (push); активный пункт подсвечивается (на экранах menu/theme/languages активен «Меню»).

## Жесты и защита

- Карточки: pointer events + `touch-action: none`, pointer capture, drag-позиция в локальном стейте; после тача игнорируются совместимые mouse-события (только у карточки — своя логика, глобально — ghostClick).
- Строки наборов: `touch-action: pan-y`, порог свайпа 10px, открытие строки сдвигом на 96px, `suppressClick` для клика после жеста.
- Контейнер `main` — `overflow-x: clip`, `body` — `overflow-x: hidden` (нет горизонтального скролла при свайпах/драге).

## Дизайн-система

### icons (`design-system/icons`, `@elemental/icons`)

- `SvgIcon`: размер через CSS `font-size` (prop `fontSize` 16/24/32 или число), `color`, `flipForRtl`, `viewBox` 24×24 по умолчанию.
- Иконки: `IconX = createIcon('IconX', <path ... fill="currentColor" />)` в `src/autoGenerated/index.tsx`, реэкспорт из `src/index.ts`. Текущий набор: ArrowLeft/Right/Up, Back, Check, CheckSmall, ChevronRight, Close, Education, Menu, MoreHorizontal, PlusBig, PlusSmall, Refresh, Restore, Settings, Star, StarFilled, Tasks, Translate, Trash, ViewList.

### ui-kit (`design-system/ui-kit`, `@elemental/ui-kit`)

- Компоненты: Box, Button, ButtonIcon, Card, **Checkbox**, Chip, Counter, Divider, EmptyScreen, FormHelperText, Header, InputText, ListItem, Menu, Radio, **Select**, Spinner, Stack, Text, IconsProvider/useIcon, ThemeProvider/useTheme/useThemeToken.
- Один компонент = папка: `<Component>.tsx`, `<Component>.module.pcss`, `<Component>.stories.tsx`, `index.ts`; экспорт из `src/index.ts`. Составные — статические поля (`Menu.Item`, `ListItem.StartBlock`).
- Токены: `src/tokens/colors.json` (dark/light), `corners.json`, `fonts.json`; `npm run generate-tokens` → `tokens.css` + `src/tokens/types.ts`. Стили используют CSS-переменные (`var(--accent-bg-default)` и т.п.).
- Темизация: `ThemeProvider` (root + themeName) проставляет переменные темы на `document.body`; переключение — `$theme` в `features/theme/store` (persist в `app.settings`).
- Иконки в компонентах ui-kit — через `IconsProvider`/`useIcon`, приложение передаёт карту из `app/src/icons.tsx`.

## Проверка изменений

- Обязательно: `npm run lint`, `npm run typecheck`, `npm run build` (корень) и `npx tsc --noEmit` в ui-kit при его изменениях.
- e2e вручную через Playwright + CDP (эмуляция `hasTouch`): скрипты лежат вне репозитория, в `/var/folders/.../T/opencode/e2e/` (не коммитятся). Сценарии: наборы/карточки/свайпы (мышь и тач), фильтры и счётчики, восстановление, языки, анимации переходов, отсутствие горизонтального скролла и авто-флипа.
