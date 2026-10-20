/**
 * Видеоинструкция для экрана «База знаний»: добавление готового курса.
 * Публикация: node audio.cjs add-ready-course --trim=auto --poster=0.6 --to=<app/public/videos>.
 */

module.exports = {
  name: 'add-ready-course',

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
    sets: [],
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
    { tap: 'Добавить курс', pause: 1000 },
    { tap: 'Найти готовый', pause: 1000 },
    { tap: 'Выберите уровень', pause: 900 },
    { tap: 'Beginner', pause: 1100 },
    { tap: 'Знакомство', pause: 1100 },
    { tap: 'Загрузить', pause: 1600 },
    { wait: 2400 },
  ],
};
