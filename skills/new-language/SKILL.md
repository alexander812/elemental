---
name: new-language
description: Добавляет или удаляет язык интерфейса Lexi (локаль react-intl — файл app/src/lib/i18n/messages/<code>.json, переводы, fallback на английский) и переводит интерфейс по списку непереведённых ключей из скрипта. Use when просят добавить/убрать язык в интерфейсе, перевести интерфейс или экраны, добавить локаль, «добавь язык интерфейса», «переведи приложение», «убери язык из интерфейса», "add UI language", "translate the interface", "remove language". Контент курсов и новый язык обучения — скилл new-course.
---

# Язык интерфейса (локаль переводов)

## Контекст (прочитать перед работой)

- `app/src/lib/i18n/index.ts`: `import.meta.glob('./messages/*.json', { eager: true })` — файл в `messages/` = подключённая локаль; `getMessages(locale)`; `FALLBACK_LOCALE = 'en'`. Английские тексты — это `defaultMessage` в коде, они же фолбэк; `messages/en.json` — снимок английских текстов для контроля изменений (в приложении не используется).
- Сообщения: в JSX — `<FormattedMessage id defaultMessage>` (`errors`/`intl` — `useIntl().formatMessage`, тексты из lib/сторов — `MessageDescriptor`). id — `scope_element_key` (snake_case), один id = один английский текст.
- Язык интерфейса — `Settings.userLang`, переключается на экране «Настройки → Язык» (`features/settings/ui/LanguageView.tsx`); список — `LANGUAGES_CATALOG` в `app/src/lib/languages.ts`. `IntlProvider` — `app/src/ThemeRoot.tsx`.
- Все правила локализации — PROJECT.md «Локализация интерфейса». Скрипт: `app/scripts/i18n.mjs`, команды из корня репозитория (`npm run i18n ...`).

## Список непереведённых ключей (не ходить по коду)

```bash
npm run i18n                      # сводка: ключей в коде, по локалям translated/total, статус снимка, структурные проблемы
npm run i18n -- --locale es       # детально: id — английский текст (место в коде) для непереведённых
npm run i18n -- --stale           # что изменилось в английских текстах и какие переводы (ru/es/fr) обновить
npm run i18n -- --write-en        # принять текущие defaultMessage как снимок messages/en.json
npm run i18n -- --json            # машиночитаемо (для скриптов; снимок — в поле snapshot)
npm run i18n -- --check           # структурная проверка + дрейф снимка, exit 1 при проблемах
```

`--check` проверяет: `FormattedMessage`/дескриптор без `defaultMessage`, один id с разными английскими текстами, ключи в JSON без кода (лишние), пустые значения, несовпадение ICU-переменных перевода и `defaultMessage`, а также расхождение кода со снимком `en.json`. Отсутствие перевода — не ошибка (штатный фолбэк на английский).

## Изменился английский текст (id тот же)

`messages/en.json` — снимок английских текстов. Если поправили текст, а ключ оставили, расхождение видно без чтения кода:

1. `npm run i18n -- --stale` — покажет по каждому изменённому ключу `было → стало` и в каких локалях есть перевод; эти переводы надо проверить и обновить.
2. Обнови переводы ru/es/fr по новому смыслу.
3. `npm run i18n -- --write-en` — принять новый английский текст в снимок.
4. `npm run i18n -- --check` — чисто.

Новый id: добавь `defaultMessage` (перевода может не быть — показывается английский), затем `--write-en` и `--check`. Удалённый id: `--write-en` уберёт его из снимка, `--check` покажет лишние ключи в локалях — удали.

## Добавить язык

1. Код языка — ISO 639-1 (`de`, `it`, ...). Если кода нет в `LANGUAGES_CATALOG` (`app/src/lib/languages.ts`) — добавь `{ code, name: '<эндоним>' }`, иначе язык не выбрать в настройках. Язык как язык обучения (готовые курсы, озвучка, распознавание) — отдельная работа скилла `new-course`; этот скилл отвечает только за интерфейс.
2. Создай `app/src/lib/i18n/messages/<code>.json` со значением `{}` — локаль подключится сама (glob).
3. Получи список ключей: `npm run i18n -- --locale <code>` (id + английские тексты; места в коде — в скобках). Те же английские тексты лежат в снимке `messages/en.json`. Ориентир по смыслу — `messages/ru.json`.
4. Переведи все ключи и запиши в файл локали: плоский `{ "id": "текст" }`, ключи как в ru.json, сортировка по алфавиту.
5. `npm run i18n` → «<code>: N/N», затем `npm run i18n -- --check` → проблем нет.
6. Смоук: настройки → «Язык» → <code>; пройди основные экраны (курсы, уроки, задания, карточки, настройки, база знаний), проверь `document.documentElement.lang` и отсутствие ошибок в консоли.

## Удалить язык

1. Удали `app/src/lib/i18n/messages/<code>.json` — интерфейс откатится на английский (`defaultMessage`), ничего больше править не нужно.
2. `npm run i18n -- --check` — проблем нет. Каталог языков (`LANGUAGES_CATALOG`), курсы, озвучка и распознавание не трогаются — это другие слои; убирать язык оттуда — только по явной просьбе.

## Как переводить (конвенции Lexi)

- Источник смысла — русский текст (`ru.json`), термины — английский `defaultMessage`. Тон — как в ru.json: короткие фразы, кнопки в инфинитиве (Save/Сохранить → Guardar, Enregistrer).
- Плейсхолдеры менять нельзя: `{name}`, `{count}`; ICU-множественные — по правилам локали: ru — `one/few/many/other`, en/es/fr — достаточно `one/other` (недостающие категории падают в `other`): `{count, plural, one {# lesson} other {# lessons}}`.
- Числа, счётчики, размеры — только через ICU-плейсхолдеры, не конкатенацией строк.
- Не переводить: названия языков (эндонимы из каталога), уровни курсов (Beginner/Elementary/Intermediate/Upper-Intermediate), имена голосов (Руслан, Lessac, Sharvard, Siwis), бренд Lexi, названия артефактов из Android-моста.
- Словарь терминов (ru → en → es → fr): курс → course → curso → cours; урок → lesson → lección → leçon; задание (набор карточек) → set → conjunto → série; карточка → card → tarjeta → carte; тест → test → test → test; выучено → learned → aprendida → apprise; проверка → check → comprobación → vérification; произношение → pronunciation → pronunciación → prononciation; распознавание речи → speech recognition → reconocimiento de voz → reconnaissance vocale; озвучка → voice/voiceover → voz → voix; настройки → settings → ajustes → réglages; тема → theme → tema → thème; данные → data → datos → données; слияние → merge → fusión → fusion; замена → replace → reemplazo → remplacement; база знаний → knowledge base → base de conocimientos → base de connaissances; свайп-подписи: удалить/later/learned → delete/later/learned → eliminar/después/aprendida → supprimer/plus tard/apprise.
- Кавычки в строках: внутри JSON-строки ставь `«…»`/`“…”` — простые `"` экранировать, а фразу с простым апострофом лучше писать через `’` (ICU treats `'` as escape character рядом с `{...}`).

## Частые ошибки

- Забыт `defaultMessage` у нового `FormattedMessage`/дескриптора — `--check` упадёт (это обязательное поле, английский текст).
- Переименованная переменная (`{count}` → `{n}`) или потерянная ветка plural — `--check` покажет несовпадение.
- Ключ в JSON, которого нет в коде (текст переписали/удалили) — лишний ключ, `--check` упадёт; удали его.
- Правка текста в коде без правки переводов: `--stale` покажет изменённые английские тексты и локали с устаревшими переводами; сначала обнови переводы, потом `--write-en`.
- `--write-en` сделан до просмотра `--stale` — список переводов на обновление потерян (снимок уже принят); сверяйся с `--stale` заранее.
- Новый/удалённый текст без `--write-en` — `--check` падает на дрейфе снимка.
- Файл локали добавлен, а языка нет в `LANGUAGES_CATALOG` — в настройках его не выбрать.
- Ожидание, что чужие тексты (контент курсов, видео, строки моста) переведутся вместе с интерфейсом — это не сюда.
