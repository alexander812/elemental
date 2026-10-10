---
name: new-course
description: Создаёт новый готовый курс для Lexi (per-language JSON в app/src/courses + регистрация в courses_beginner.json) и добавляет новый язык в курсы, каталог и персонажей. Use when просят создать/добавить готовый курс, новый курс для каталога, новый язык, перевод курса на другой язык, «создай курс», «добавь курс», «добавь язык», "new course", "add language", "translate course".
---

# Новый готовый курс и новый язык

## Контекст (прочитать перед работой)

- `app/src/courses/characters.txt` — канон мира: персонажи, локализованные имена на 7 языках, города по языкам, питомцы, карта связей, таблица «как использовать в уроках». Любой курс — продолжение этого «сериала».
- `app/src/courses/image_prompts.md` — внешность персонажей и локации; детали в текстах должны ей соответствовать (рыжий Джордж, чёрно-белая Мурка, Мурка на подоконнике и т.д.).
- Примеры курсов: `app/src/courses/course_0*.<lang>.json`; пример каталога — `app/src/courses/courses_beginner.json`.
- `PROJECT.md` → разделы «Готовые курсы», «Языки», «Модель данных».

## Формат данных

Каждый курс — 7 файлов в `app/src/courses/`, по одному на язык: `course_NN_<slug>.<lang>.json`, где `lang` ∈ `en`, `ru`, `es`, `fr`, `it`, `zh`, `de`. В файле только один язык:

```json
{
  "parentCourse": "Acquaintance",
  "lang": "en",
  "lessons": [
    {
      "name": "Lesson name",
      "tasks": [
        { "name": "Task", "text": "Story text", "words": ["word1", "...", "word10"] }
      ]
    }
  ]
}
```

Правила:

- 4 урока на курс (допустимо 3–5), в каждом ровно 5 заданий.
- Задание — эпизод истории, а не список фраз: сценка с персонажами, диалоги, развитие арки; отдельные курсы ссылаются друг на друга.
- Текст задания: 400–530 знаков для `en/ru/es/fr/it/de`; `zh` — естественно короче (иероглифы плотнее, ориентир 130–260).
- `words` — ровно 10 на язык, строго выровнены по индексу между языками: карточки собираются парами по индексу (`buildReadyCourses`: пользовательская сторона из файла `userLang`, изучаемая из файла `lang`, количество берётся по минимуму). Разъехались индексы — карточки теряются или путаются.
- Имена и города — из `characters.txt` для каждого языка, а не транслит: ru Анна/Дмитрий/Тёма, en Emma/David/Ollie, es Carmen/Carlos/Pablito, fr Claire/Pierre/Hugo, it Giulia/Marco/Matteo, zh 李梅/王强/王阳, de Anna/Thomas/Felix. Картеры всегда из Лондона (миссис Картер — из Австралии). Города: ru Санкт-Петербург, en London, es Oviedo, fr Paris, it Roma, zh 北京, de München.
- Внутри JSON-строк не использовать прямые кавычки `"` — только «…», “…” или „…“, иначе файл не парсится.

## Каталог

`courses_beginner.json` — единственный файл, где есть все языки сразу. Запись курса:

```json
{
  "course": "Holidays",
  "level": "Beginner",
  "files": {
    "en": "course_03_holidays.en.json",
    "ru": "course_03_holidays.ru.json",
    "es": "course_03_holidays.es.json",
    "fr": "course_03_holidays.fr.json",
    "it": "course_03_holidays.it.json",
    "zh": "course_03_holidays.zh.json",
    "de": "course_03_holidays.de.json"
  },
  "i18n": {
    "course": { "en": "Holidays", "ru": "Праздники", "es": "Las fiestas", "fr": "Les fêtes", "it": "Le feste", "zh": "节日", "de": "Feste" },
    "description": { "en": "...", "ru": "...", "es": "...", "fr": "...", "it": "...", "zh": "...", "de": "..." }
  }
}
```

Файлы кладутся в `app/src/courses/` — их подхватывает `import.meta.glob` в `app/src/transport/catalog.ts`, каждый становится отдельным чанком.

## Шаги: новый курс

1. Прочитать `characters.txt` и 1–2 примерных курса; выбрать следующий свободный номер `NN` и тему, не дублирующую уже описанные арки (см. таблицу тем в `characters.txt` и уже загруженные курсы).
2. Придумать арку на 4 урока × 5 заданий (например: знакомство → событие → конфликт → развязка).
3. Написать 7 per-language файлов: `en` как база, затем остальные языки (переводчику-модели проще идти задание за заданием по всем языкам сразу).
4. Зарегистрировать курс в `app/src/courses/courses_beginner.json`: `files` на 7 языков + `i18n.course` и `i18n.description` на 7 языках.
5. Проверить: `node skills/new-course/scripts/validate-course.mjs course_NN_<slug>`.
6. Прогнать `npm run lint`, `npm run typecheck`, `npm run build`.

## Шаги: новый язык (например, `pt`)

1. Добавить язык в `LANGUAGES_CATALOG` в `app/src/lib/languages.ts` (код + название); при необходимости — в дефолты.
2. Дополнить `app/src/courses/characters.txt`: имена всех персонажей и города для нового языка.
3. Для каждого курса создать `course_NN_<slug>.<lang>.json` — полный перевод, `words` выровнены по индексу (10 пар на задание).
4. Во всех записях `courses_beginner.json` добавить язык в `files` и в `i18n.course`/`i18n.description`.
5. Проверить все курсы: `node skills/new-course/scripts/validate-course.mjs --all`.
6. `npm run lint`, `npm run typecheck`, `npm run build`. Учесть сервисы: перевод (`transport/translate.ts`), озвучка (`transport/speech.ts`; на экране «Озвучка» нейроголоса есть только для 7 языков), OCR.
7. `DATA_VERSION` не поднимать: модели данных и форматы localStorage не менялись.

## Валидация

```bash
node skills/new-course/scripts/validate-course.mjs course_05_friends   # один курс
node skills/new-course/scripts/validate-course.mjs --all               # все курсы из каталога
COURSES_DIR=app/src/courses node ...                                   # если запуск не из корня
```

Скрипт проверяет: 7 файлов на месте и валидны; `lang`/`parentCourse`; 3–5 уроков по 5 заданий; 10 непустых слов на язык; совпадение количества уроков/заданий/слов между языками; регистрацию в `courses_beginner.json` (все 7 языков в `files` и `i18n`). Предупреждает о длине текста вне 400–530 (для `zh` — только нижняя граница).

## Частые ошибки

- Разные длины `words` между языками — карточки обрезаются по минимуму, пары съезжают.
- Прямые кавычки внутри строк — невалидный JSON.
- Забытый язык в `files` или `i18n` — курс молча не загрузится на этом языке (`buildReadyCourses` пропускает запись без файла).
- Транслит имён вместо локализации — рушит канон `characters.txt`.
- Язык курса у готового курса выбирается при загрузке; в самом курсе язык фиксирован `lang` и не меняется.
- Новый курс без арки (набор несвязанных фраз) — курсы должны читаться как серии.
