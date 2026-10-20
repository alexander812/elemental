/**
 * Шаблон сценария. Скопируй в scenarios/<id>.cjs и заполни.
 *
 * name — имя ролика (используется в именах файлов: <name>.mp4/.jpg);
 * seed — что лежит в localStorage на старте (ключи app.courses/app.lessons/app.sets/app.settings);
 *        app.onboarding движок проставляет сам (completed + все подсказки показаны), можно переопределить;
 * steps — порядок действий.
 *
 * Правила:
 * - первый кадр ролика = экран, с которого начинается сценарий (он же станет постером);
 * - подписи (`caption`) не должны перекрывать sticky-кнопки внизу экрана — если перекрывают,
 *   лучше без подписей;
 * - между экранами анимация ~300 мс, ждать её не нужно: `pause` по умолчанию уже с запасом.
 */

module.exports = {
  name: 'example',

  seed: {
    courses: [
      { id: 'c1', name: 'Курс', description: 'Описание курса', order: 0, lang: 'en' },
    ],
    lessons: [{ id: 'l1', courseId: 'c1', name: 'Урок 1', order: 0 }],
    sets: [
      {
        id: 's1',
        lessonId: 'l1',
        name: 'Задание',
        active: true,
        order: 0,
        swapped: false,
        examPassed: false,
        texts: { ru: 'Текст', en: 'Text' },
        cards: [
          { id: 'k1', texts: { ru: 'Понедельник', en: 'Monday' }, learned: false, deleted: false, voiceCheck: null, writeCheck: null },
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
    { wait: 600 },
    { tap: 'Уроки' },
    { tap: 'Урок 1' },
    { tap: 'Задание' },
    { tap: 'Далее' },
    { caption: 'Тап по карточке — переворот', captionMs: 2200, tap: 'Monday' },
    { swipe: { target: 'Monday', dir: 'left' } },
    { back: true },
  ],
};
