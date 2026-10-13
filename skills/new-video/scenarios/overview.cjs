/**
 * Общий ролик «Знакомство с Lexi»: три сцены.
 *   1. Загрузка готового курса → переход на загруженный курс со списком уроков.
 *   2. Задание: урок → текст задания → карточки (переворот, озвучка, проверки) —
 *      3 слова верно, 1 неверно и уходит в невыученные.
 *   3. Тест по заданию — все ответы верные, экран результатов.
 *
 * Специально для ролика своё задание — на 4 карточки (в готовых курсах задачи по 10 слов).
 * Публикация:
 *   node skills/new-video/engine/audio.cjs overview --trim=auto --webm --poster=0.6 --to=app/public/videos
 */

module.exports = {
  name: 'overview',

  seed: {
    courses: [
      {
        id: 'c1',
        name: 'Знакомство с Лекси',
        description:
          'Привет! Я Лекси, я помогу тебе учить иностранный язык. Качай готовые курсы или создавай что угодно сам.',
        order: 0,
        lang: 'en',
      },
    ],
    lessons: [{ id: 'l1', courseId: 'c1', name: 'Урок 1', order: 0 }],
    sets: [
      {
        id: 's1',
        lessonId: 'l1',
        name: 'Дни недели',
        active: true,
        order: 0,
        swapped: false,
        examPassed: false,
        texts: { ru: 'Дни недели', en: 'Days of the week' },
        cards: [
          { id: 'k1', texts: { ru: 'Понедельник', en: 'Monday' }, learned: false, deleted: false, voiceCheck: null, writeCheck: null },
          { id: 'k2', texts: { ru: 'Вторник', en: 'Tuesday' }, learned: false, deleted: false, voiceCheck: null, writeCheck: null },
          { id: 'k3', texts: { ru: 'Среда', en: 'Wednesday' }, learned: false, deleted: false, voiceCheck: null, writeCheck: null },
          { id: 'k4', texts: { ru: 'Четверг', en: 'Thursday' }, learned: false, deleted: false, voiceCheck: null, writeCheck: null },
        ],
      },
    ],
    settings: {
      theme: 'dark',
      userLang: 'ru',
      learnAfterChecks: false,
      voiceCheckEnabled: true,
      writeCheckEnabled: false,
      debugMode: false,
    },
  },

  steps: [
    // --- Сцена 1: загрузка готового курса ---
    { scene: { title: 'Сцена 1', text: 'Для начала загрузим готовый курс.' } },
    { hint: 'Откроем меню добавления курса', tap: 'Добавить курс' },
    { hint: 'Готовые курсы разбиты по уровням', tap: 'Найти готовый' },
    { hint: 'Выберите уровень владения языком', tap: 'Выберите уровень' },
    { tap: 'Beginner', pause: 1000 },
    { hint: 'Отметьте нужные курсы', tap: 'Знакомство' },
    { hint: 'Загрузка занимает пару секунд', tap: 'Загрузить', pause: 2000 },
    { hint: 'Откроем загруженный курс', tap: 'Знакомство (Ru-En)', pause: 1800 },

    // --- Сцена 2: проходим задание ---
    { scene: { title: 'Сцена 2', text: 'Пройдём задание со словами.' } },
    { hint: 'Переключимся на свой курс', tap: 'Курсы' },
    { tap: 'Знакомство с Лекси (Ru-En)', pause: 1000 },
    { tap: 'Урок 1', pause: 900 },
    { hint: 'Откроем задание', tap: 'Дни недели', pause: 900 },
    { hint: 'Сначала знакомимся с текстом задания', tap: 'Далее', pause: 900 },

    { hint: 'Тап по карточке — переворот', tap: 'Monday', pause: 1300 },
    {
      hint: 'Кнопка озвучивает слово',
      say: 'Понедельник',
      sayLang: 'ru',
      sayDelay: 700,
      tap: 'Озвучить',
      pause: 1900,
    },
    { tap: 'Понедельник', pause: 1200 },
    {
      hint: 'Микрофон проверяет произношение',
      speech: 'Monday',
      speechDelay: 1200,
      tap: 'Проверить произношение',
      pause: 2200,
    },
    { hint: 'Свайп влево — слово выучено', swipe: { target: 'Monday', dir: 'left' }, pause: 1300 },

    {
      hint: 'Вторник произнесём неверно',
      say: 'Sunday',
      sayLang: 'en',
      sayDelay: 1100,
      speech: 'Sunday',
      speechDelay: 1100,
      tap: 'Проверить произношение',
      pause: 2600,
    },
    { hint: 'Свайп вправо — вернёмся к слову позже', swipe: { target: 'Tuesday', dir: 'right' }, pause: 1500 },

    {
      hint: 'Среда — произносим верно',
      speech: 'Wednesday',
      speechDelay: 1100,
      tap: 'Проверить произношение',
      pause: 2200,
    },
    { swipe: { target: 'Wednesday', dir: 'left' }, pause: 1200 },
    {
      hint: 'Четверг — произносим верно',
      speech: 'Thursday',
      speechDelay: 1100,
      tap: 'Проверить произношение',
      pause: 2200,
    },
    { swipe: { target: 'Thursday', dir: 'left' }, pause: 1500 },

    // --- Сцена 3: тест ---
    { scene: { title: 'Сцена 3', text: 'Проверим слова в режиме теста.' } },
    { hint: 'Тест проверяет произношение по всем словам', tap: 'Тест', pause: 1300 },
    {
      hint: 'Скажите слово',
      speech: 'Monday',
      speechDelay: 1100,
      tap: 'Проверить произношение',
      pause: 2200,
    },
    { speech: 'Tuesday', speechDelay: 1000, tap: 'Проверить произношение', pause: 2200 },
    { speech: 'Wednesday', speechDelay: 1000, tap: 'Проверить произношение', pause: 2200 },
    { speech: 'Thursday', speechDelay: 1000, tap: 'Проверить произношение', pause: 2600 },
    { hint: 'Все ответы верные — тест пройден', pause: 2600 },
  ],
};
