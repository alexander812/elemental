# Lexi — описание проекта

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
- Платформенные бинарники (esbuild, rollup, rolldown, lightningcss) ставятся только через optional-зависимости самих пакетов из полного lockfile; `overrides` в корне нет.

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

## Деплой (Vercel)

- Настройки проекта: Root Directory — корень репозитория; сборка описана в корневом `vercel.json` (`installCommand: npm ci`, `buildCommand: npm run build --workspace @elemental/app`, `outputDirectory: app/dist`, `framework: null`). Node 22.
- Критично: `package-lock.json` обязан содержать платформенные optional-пакеты (`node_modules/rolldown`, `node_modules/lightningcss-*`, `@rolldown/binding-*`, `@rollup/rollup-*`, `@esbuild/*`). Если их нет, чистая установка на Linux оставляет Vite 8 без `rolldown` и сборка падает (`ERR_MODULE_NOT_FOUND: Cannot find package 'rolldown'`).
- Нельзя добавлять платформенные пакеты прямыми зависимостями и нельзя использовать `overrides` (например, для esbuild): на чужой платформе npm падает с `EBADPLATFORM` на платформенных optional-пакетах. Платформы обеспечивает только полный lockfile.
- Проверка целостности lock: `grep -c '"node_modules/rolldown"' package-lock.json` и `grep -c 'lightningcss-linux-x64-gnu' package-lock.json` (должны быть > 0).
- Пересоздавать lock только в чистой копии репозитория без `node_modules` (`npm install`), после чего проверять сценарий Vercel: свежая копия → `npm ci` → `npm run build --workspace @elemental/app` → `app/dist/index.html`.

## Деплой (GitHub Pages)

- Workflow `.github/workflows/deploy.yml`: push в `main` (или ручной запуск) → `npm ci` → сборка `@elemental/app` с `DEPLOY_BASE=/elemental/` → публикация `app/dist` на GitHub Pages: `https://alexander812.github.io/elemental/`.
- `base` в `app/vite.config.ts` берётся из `DEPLOY_BASE` (по умолчанию `/`), локальная разработка и preview не меняются.
- При первом запуске workflow сам включает Pages (`configure-pages` с `enablement: true`), источник — GitHub Actions.

## PWA

- `app/public/manifest.webmanifest`: `display: standalone`, portrait, `start_url`/`scope` = `.` (работает и на Pages, и локально), иконки 192/512 `any` + `maskable`, apple-touch-icon 180, тема `#050505`.
- Иконка: эмблема — мозг в разрезе, левая половина красная (`#f14f5d`) с белой «A» (Avenir Next Condensed Bold, переведена в кривые), правая жёлтая (`#ffcc4a`) с чёрным 文; `icons/logo.svg` — эмблема + «Lexi» (Inter 700, кривые, текст `currentColor`), `icons/emblem.svg` — эмблема без фона, `icons/icon.svg` — иконка на тёмном `#050505`, `favicon.svg` — эмблема на тёмном скруглённом квадрате. В `icon.svg`/`favicon.svg` эмблема отмасштабирована на всю ширину (group transform, границы мозга посчитаны по кривым Безье). PNG-набор сгенерирован из `icon.svg` (maskable — уменьшена под safe zone). `index.html` подключает manifest, apple-touch-icon и meta для standalone на iOS.
- `app/public/sw.js`: предкэш оболочки (`./`, manifest, favicon, иконки) в `elemental-v1`; навигация — network-first с фолбэком на кэш, статика — cache-first с фоновым обновлением; запросы на чужие origin (перевод) не кэшируются. Регистрация — в `main.tsx` только в PROD, путь от `import.meta.env.BASE_URL`.

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
transport/*.ts           # чистые async-функции (localStorage через lib/storage, перевод через translate.ts, озвучка через speech.ts — Web Speech API, системный TTS или локальные нейроголоса через мост, голоса через voices.ts, OCR через ocr.ts, вибрация через haptics.ts)
lib/
  storage.ts             # load/save/remove, префикс ключей "app."
  uid.ts                 # uid(): crypto.randomUUID с фолбэком (нужен на HTTP вне localhost)
  types.ts               # Card, CardSet, Settings, ThemeName
  languages.ts           # каталог языков (LANGUAGES_CATALOG), LanguageCode, дефолты, getLanguageName
  ghostClick.ts          # подавитель «призрачных» кликов после тач-навигации
  nativeBridge.ts        # клиент моста в Android-обёртку: window.AndroidBridge, callNative, isNativeBridgeAvailable
```

Паттерн: UI читает сторы через `useUnit`; любое действие — вызов `*Fx`; транспорт знает только пути к данным. Комментарии в коде не приняты.

## Модель данных

```ts
Card      { id, texts: { [lang]: string }, learned, deleted }
CardSet   { id, name, active, order, originalLang, translationLang, cards: Card[] }
Settings  { theme: 'dark' | 'light', originalLang, translationLang }
```

- Ключи localStorage: `app.sets`, `app.seeded`, `app.settings`.
- У каждого набора своя пара языков (`originalLang`/`translationLang`). `Card.texts` хранит тексты карточки по языкам, `{ ru: 'Понедельник', en: 'Monday' }`; лицевая сторона показывает текст языка оригинала набора, обратная — языка перевода. Помощник — `lib/cards.ts: getCardText(card, lang)` (с фолбэком на любой доступный язык); `remapTexts(texts, originalLang, translationLang)` берёт тексты под новой парой языков (используется при смене языков набора).
- `learned` — карточка выучена (свайп влево), `deleted` — мягко удалена (свайп вверх или «Удалить все карточки»), такие карточки не показываются в колоде и счётчиках, но восстанавливаются.
- Seed: набор «Дни недели» (ru→en), 7 карточек (`transport/sets.ts`).
- Миграция в `transport/sets.ts`: `migrateSet` добавляет старым наборам пару языков из текущих настроек (без изменения текстов карточек), `migrateCard` конвертирует старые карточки (`original`/`translation` ± `originalLang`/`translationLang`) в `texts`; у совсем старых данные меняются местами (ru↔en), `deleted: false`.
- `restoreCards(setId, cardIds)` — `deleted=false, learned=false` (возврат в невыученные).
- `updateCard(setId, cardId, texts)` — перезаписывает `texts` карточки парой языков набора.

## Языки

- Каталог языков — `LANGUAGES_CATALOG` в `lib/languages.ts` (7 записей: `ru Русский`, `en English`, `es Español`, `fr Français`, `it Italiano`, `zh 中文`, `de Deutsch`); `LanguageCode = string`, `getLanguageName(code, languages)` с фолбэком на код.
- Все языки каталога доступны сразу — отдельного добавления/удаления языков нет, `$languages` в `features/languages/store` — константный стор с каталогом.
- Дефолты: оригинал — русский, перевод — английский (`DEFAULT_ORIGINAL_LANG`, `DEFAULT_TRANSLATION_LANG`).
- Настройки (`Settings.originalLang`/`translationLang`) задают пару языков по умолчанию для новых наборов. Экран «Языки» (`features/settings/ui/LanguagesView.tsx`): два `Select` (все 7 языков) + «Применить» (`setLanguagesFx` → `transport/settings.saveLanguages`); одинаковые языки запрещены. Кнопки управления списком языков нет.
- У каждого набора своя пара языков, она выбирается в форме создания/редактирования набора. Смена языков набора синхронизирует карточки: тексты переносятся по языковым ключам (`remapTexts`), поэтому обмен языков местами меняет оригинал и перевод карточки, а новый язык без текста даёт пустое поле (старый текст этого языка не сохраняется).
- Создание карточки (`CardCreateView`) пишет тексты под языками набора; перевод (`transport/translate.ts`, ISO-код) и озвучка (`transport/speech.ts`, локаль по коду) работают для языков каталога. `speak()` выбирает способ сам: при наличии моста — нативный `speak`, иначе Web Speech API (`canSpeak()` учитывает оба варианта).

## Навигация (`features/navigation/store`)

- Состояние `$nav: { stack: Screen[], transition }`; события `pushScreen`, `popScreen`, `popTo`, `goToRoot`, `transitionEnded`; производные `$stack`, `$screen`, `$transition`, `$canGoBack`.
- Экраны: `sets`, `set-create{setId?}` (создание; с `setId` — редактирование набора), `cards{setId}`, `card-create{setId, cardId?}`, `cards-restore{setId}`, `text-add{setId}`, `words-translate{setId}`, `settings`, `theme`, `languages`, `voices`, `data`.
- `popTo(name)` срезает стек до последнего экрана с таким именем (например, после добавления карточек из текста — `popTo('cards')`).
- Анимации (`AppLayout.tsx` + `AppLayout.module.pcss`): при push новый экран выезжает слева (`slide-in-left`, класс `screenEntering`); при pop уходящий экран уезжает влево оверлеем (`slide-out-left`, класс `screenExiting`, очистка по `animationend` и таймауту 400мс через `transitionEnded`). При смене экрана `main` скроллится вверх. Учитывается `prefers-reduced-motion`.
- `lib/ghostClick.ts`: после навигации включается подавление совместимых mouse-событий (mousedown/mouseup/click) без предшествующего `pointerdown` — защита от «призрачного» клика по новому экрану после тач-тапа (иначе, например, вход в набор автоматически переворачивал карточку). Suppressor «взводится» на `pushScreen`/`popScreen`/`goToRoot`.

## Экраны и функционал

- **Наборы** (`features/sets/ui/SetsView.tsx`): в шапке — логотип (`favicon.svg`) слева от «Lexi»; список активных наборов, счётчики выучено/не выучено (нули показываются), тап — открыть набор, свайп вправо — мягко удалить (корзина, подтверждение тапом), перетаскивание — порядок (на тач-устройствах — long-press 420мс, мышью — сразу вертикальным движением; текст не выделяется, после отпускания порядок применяется без «прыжка»: карточка ждёт применения и меняется без transition через settle-флаг), «Добавить новый» — экран создания.
- **Создание и редактирование набора** (`features/set-create`): имя; выбор языков оригинала и перевода (`Select`, по умолчанию из настроек) и кнопка «Поменять местами» (иконка `IconSwapVert`) — языки меняются местами, а тексты карточек/пар переносятся по языковым ключам (`remapTexts`); пары полей «оригинал/перевод» (как на `words-translate`) с кнопками «Перевести все» (`translatePairsFx`: если оригинал заполнен — переводит его в перевод, если пуст — переводит перевод в оригинал; ошибки — подсказкой) и «Добавить слово» (`IconPlusBig`); в режиме редактирования (`setId`) — заголовок «Изменить набор», предзаполненные пары по не удалённым карточкам и кнопка «Сохранить». Создание — `createSetFx` → `transport/sets.createSet` (набор с карточками), редактирование — `updateSetFx` → `transport/sets.updateSet` (имя, языки, тексты пар; для карточек без пары при смене языков тексты ремапятся, новые пары добавляются новыми карточками). Одинаковые языки запрещены.
- **Карточки** (`features/cards/ui/CardsView.tsx` + `FlashCard.tsx`): колода до 3 карточек, тап — флип (CSS 3D), стороны берутся из `texts` по языкам набора, свайпы: влево «выучено», вправо «позже», вверх «удалить» (порог 110px), при свайпе — вибрация через мост (`transport/haptics.ts`: вправо короткий импульс 20мс, влево — вдвое длиннее 40мс; в браузере без моста no-op), подписи-подсказки жестов; на видимой стороне верхней карточки — кнопки с иконками: «Изменить» открывает `card-create{setId, cardId}` с предзаполненными текстами карточки, и звука (показывается, если доступна озвучка — Web Speech API в браузере или мост в Android): озвучивает текст этой стороны (`speakFx` → `transport/speech.ts`; в Android сначала скачанный локальный нейроголос, иначе системный TTS, локаль по ISO-коду языка), при ошибке под колодой появляется подсказка (`$speakFailed`: «Нет голоса для этого языка», «Озвучка недоступна на устройстве», «Скачайте голос в Настройки → Озвучка», «Обновите приложение»); клик не переворачивает карточку и не начинает свайп (stopPropagation на pointerdown/click); фильтры «выучено/не выучено» с количеством; меню «…»: «Редактировать» (открывает `set-create{setId}`), «Добавить текст», «Удалить все карточки» (мягко, по текущему фильтру), «Восстановить удалённые», «Удалить весь набор» (безвозвратно: `deleteSetFx` удаляет набор с карточками, перед этим — инлайн-подтверждение в области колоды, затем `goToRoot`); выпадающее меню лежит выше карточек (в ui-kit `Header` блоки шапки имеют z-index 200); пустые состояния и финалы: «Начать сначала» (когда всё просмотрено, но есть невыученные), «Все карточки выучены» + «Перейти к следующему набору»; в фильтре «выучено» после просмотра всех выученных — «Повторить» (сбрасывает сессию просмотра), а если выученных нет — пустой экран «Нет выученных карточек».
- **Восстановление** (`features/cards/ui/CardsRestoreView.tsx`): список удалённых карточек — слева Checkbox, справа текст на языке оригинала набора + название языка; кнопка «Восстановить» активна при выборе; после восстановления — возврат на экран карточек, карточки снова невыученные.
- **Добавить текст** (`features/text-add`): пункт «Добавить текст» в меню «…» набора. Экран `text-add`: `Textarea` и кнопка «Сканировать текст» — показывается только в Android-приложении (когда доступен `window.nativeBridge`), вызывает `scanTextFx` → `transport/ocr.ts` → нативную камеру с Tesseract, распознанный текст дописывается в поле; по кнопке «Разобрать» текст превращается в чипы-слова (`Chip` с `checked`; слова режутся по пробелам, пунктуация по краям обрезается, дубликаты без учёта регистра убираются), выбор слов тапом, «Обработать» → экран `words-translate`. Там пары полей оригинал/перевод (языки набора) и кнопка «Перевести все» (`translateAllFx` последовательно переводит все пары с непустым оригиналом через тот же `transport/translate.ts`), ошибки — подсказкой, «Добавить» → `addCardsFx` (батч `transport/sets.addCards`) и `popTo('cards')`. Выбор слов сохраняется при возврате назад (`popScreen`), состояние сбрасывается при новом входе в `text-add`.
- **Добавление и редактирование слова** (`features/card-create`): два поля (оригинал/перевод) с языками набора в подписи, «Сохранить». В режиме редактирования (`cardId` в экране) поля предзаполнены текстами карточки, заголовок «Изменить слово», сохранение — `updateCardFx` → `transport/sets.updateCard` (тексты под языками набора), иначе — `addCardFx`. Рядом с полем оригинала — круглая кнопка с иконкой перевода: вызывает `translateFx` → `transport/translate.ts` (Google `translate_a/single`, `client=gtx`, без ключа и бэкенда) и подставляет результат в поле перевода; пока идёт запрос — лоадер на кнопке, при ошибке — подсказка «введите перевод вручную»; перевод можно править, API понимает и слова, и фразы.
- **Настройки** (`features/settings/ui/MenuView.tsx`, экран `settings`): пункты «Тема», «Языки», «Озвучка» (только в Android, при наличии моста) и «Данные».
- **Тема** (`features/settings/ui/ThemeView.tsx`): светлая/тёмная.
- **Озвучка** (`features/voices`, экран `voices`): список 7 языков каталога с локальным нейроголосом Piper (Руслан, Lessac, Sharvard, Siwis, Paola, Thorsten, Huayan) и размером (~64–80 МБ); «Скачать» с прогрессом (`downloadVoiceFx` → `transport/voices.ts` → мост `downloadVoice`) и «Удалить» (`deleteVoiceFx`); пока идёт загрузка, статус опрашивается раз в секунду (`fetchVoicesFx` → `ttsVoices`); ошибки — подсказкой, состояние — `$voices`; в браузере без моста — «Доступно только в Android-приложении». Голоса хранятся в Android-приложении (`filesDir/tts`).
- **Данные** (`features/backup/ui/DataView.tsx`, экран `data`): «Экспортировать» — скачивает JSON-файл `lexi-backup-ГГГГ-ММ-ДД.json` (`transport/backup.ts: createBackup` + `downloadBackup`): `{ version, exportedAt, sets, languages, settings }` (`languages` — каталог, для совместимости); «Импортировать» — скрытый `input[type=file]`, `parseBackup` валидирует и мигрирует данные (поддерживает и старый формат — просто массив наборов; наборам без языков подставляет языки из бэкапа/настроек), показывает превью (имя файла, число наборов/карточек/языков, предупреждение) и по кнопке «Импортировать» через `importBackupFx` полностью заменяет `app.sets`/`app.seeded` (в `replaceSets`) и `app.settings`, затем `goToRoot`. После импорта `$sets`/`$settings` обновляются через `.on(importBackupFx.doneData)`; невалидный файл — подсказка «Не удалось прочитать файл». Фича — `features/backup` (store + ui).
- **Футер** (`AppLayout.tsx`): «Наборы» (goToRoot), «Настройки» (иконка шестерёнки, push); активный пункт подсвечивается (на экранах settings/theme/languages/voices/data активны «Настройки»).

## Жесты и защита

- Карточки: pointer events + `touch-action: none`, pointer capture, drag-позиция в локальном стейте; после тача игнорируются совместимые mouse-события (только у карточки — своя логика, глобально — ghostClick).
- Строки наборов: `touch-action: pan-y`, порог свайпа 10px, открытие строки сдвигом на 96px, `suppressClick` для клика после жеста.
- Контейнер `main` — `overflow-x: clip`, `body` — `overflow-x: hidden` (нет горизонтального скролла при свайпах/драге).

## Дизайн-система

### icons (`design-system/icons`, `@elemental/icons`)

- `SvgIcon`: размер через CSS `font-size` (prop `fontSize` 16/24/32 или число), `color`, `flipForRtl`, `viewBox` 24×24 по умолчанию.
- Иконки: `IconX = createIcon('IconX', <path ... fill="currentColor" />)` в `src/autoGenerated/index.tsx`, реэкспорт из `src/index.ts`. Текущий набор: ArrowLeft/Right/Up, Back, Check, CheckSmall, ChevronRight, Close, Download, Edit, Education, Menu, MoreHorizontal, Palette, PlusBig, PlusSmall, Refresh, Restore, Scan, Settings, Sound, Star, StarFilled, SwapVert, Tasks, Translate, Trash, Upload, ViewList.

### ui-kit (`design-system/ui-kit`, `@elemental/ui-kit`)

- Компоненты: Box, Button, ButtonIcon, Card, **Checkbox**, Chip, Counter, Divider, EmptyScreen, FormHelperText, Header, InputText, ListItem, Menu, Radio, **Select**, Spinner, Stack, Text, **Textarea**, IconsProvider/useIcon, ThemeProvider/useTheme/useThemeToken.
- Один компонент = папка: `<Component>.tsx`, `<Component>.module.pcss`, `<Component>.stories.tsx`, `index.ts`; экспорт из `src/index.ts`. Составные — статические поля (`Menu.Item`, `ListItem.StartBlock`).
- Токены: `src/tokens/colors.json` (dark/light), `corners.json`, `fonts.json`; `npm run generate-tokens` → `tokens.css` + `src/tokens/types.ts`. Стили используют CSS-переменные (`var(--accent-bg-default)` и т.п.).
- Темизация: `ThemeProvider` (root + themeName) проставляет переменные темы на `document.body`; переключение — `$theme` в `features/theme/store` (persist в `app.settings`).
- Иконки в компонентах ui-kit — через `IconsProvider`/`useIcon`, приложение передаёт карту из `app/src/icons.tsx`.

## Android-обёртка

- `/Users/a.smirnov/p/lexi-android` — отдельный репозиторий (создан из шаблона `/Users/a.smirnov/p/android-webview-template`): WebView-обёртка Lexi с мостом `vibrate`/`deviceInfo`/`scanText`/`speak`, OCR на Tesseract4Android (вшиты ru/en, остальные языки скачиваются при первом использовании).
- URL веб-приложения настраивается в `app/webview.properties` (debug → `webview.devUrl`, release → `webview.prodUrl` = GitHub Pages).
- Кнопка «Сканировать текст» на экране `text-add` работает через `lib/nativeBridge.ts`; в браузере она скрыта.
- Вибрация при свайпах карточек — `transport/haptics.ts` → `callNative('vibrate', { durationMs })` (в Android `NativeBridge` использует `VibrationEffect.createOneShot`, ограничение 1–10000мс); в браузере вызовов нет.
- Озвучка карточек — `callNative('speak', { text, lang })`: `speech/SpeechService.kt` выбирает способ — скачанный локальный нейроголос (`speech/LocalTts.kt`) → системный `TextToSpeech` (`speech/SpeechSynthesizer.kt`, очередь до `onInit`, `QUEUE_FLUSH`; в манифесте — `<queries>` с `TTS_SERVICE` для Android 11+) → ошибка `voice_missing`; в браузере и без моста — Web Speech API.
- Офлайн-голоса — sherpa-onnx (Apache-2.0): AAR `app/libs/sherpa-onnx-1.13.8.aar` (нативные либы только arm64-v8a/armeabi-v7a, APK ~96 МБ) + Piper-модели (`speech/VoiceCatalog.kt`), скачиваются по кнопке на экране «Озвучка» (~64–80 МБ): сначала HuggingFace `csukuangfj/vits-piper-<id>` (`.onnx` + `tokens.txt`), при ошибке — GitHub-релиз `tts-models` (tar.bz2 через commons-compress); всё кладётся в `filesDir/tts`, общий `espeak-ng-data` вшит в APK (`assets/tts/espeak-ng-data.zip`), синтез и воспроизведение — через AudioTrack. Управление — мост `ttsVoices`/`downloadVoice`/`deleteVoice` (`speech/VoiceManager.kt`); ошибки загрузки приходят в `error` с деталями.

## Проверка изменений

- Обязательно: `npm run lint`, `npm run typecheck`, `npm run build` (корень) и `npx tsc --noEmit` в ui-kit при его изменениях.
- e2e вручную через Playwright + CDP (эмуляция `hasTouch`): скрипты лежат вне репозитория, в `/var/folders/.../T/opencode/e2e/` (не коммитятся). Сценарии: наборы/карточки/свайпы (мышь и тач), фильтры и счётчики, восстановление, создание/редактирование набора (языки, swap, пары, синхронизация текстов), языки (каталог в настройках), удаление набора, экспорт/импорт бэкапа, анимации переходов, отсутствие горизонтального скролла и авто-флипа.
