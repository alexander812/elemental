/**
 * Тестовый фрагмент «Загрузка курса с диктором» (~55 с).
 * Все действия комментирует диктор — что делаем и зачем; тултипов нет.
 * Голос — нейросетевой edge-tts (NARRATOR), паузы подогнаны под длину реплик
 * (реплика + ~0,8 с), чтобы голос не накладывался сам на себя.
 *
 * Запись:  node skills/new-video/engine/runner.cjs skills/new-video/scenarios/narrated-load-test.cjs
 * Предпросмотр (без публикации в приложение):
 *   node skills/new-video/engine/audio.cjs narrated-load-test --trim=auto
 */

const NARRATOR = 'edge:ru-RU-DmitryNeural';

module.exports = {
  name: 'narrated-load-test',

  seed: {
    // Свежая установка: курсов нет (курс по умолчанию приложение больше не создаёт).
    courses: [],
    lessons: [],
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
    { wait: 900 },
    {
      scene: { title: 'Шаг 1', text: 'Для начала загрузим готовый курс.' },
      pause: 3200,
      say: 'Начнём с загрузки готового курса — создавать его самому не нужно.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Добавить курс',
      pause: 3700,
      say: 'Открываем добавление курса.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Найти готовый',
      pause: 5500,
      say: 'Выбираем «Найти готовый» — откроется каталог курсов.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Выберите уровень',
      pause: 4200,
      say: 'Выбираем уровень владения языком.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Beginner',
      pause: 6600,
      say: 'Beginner — уровень для начинающих: в каталоге останутся подходящие курсы.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Знакомство',
      pause: 6900,
      say: 'Отмечаем курс «Знакомство» — галочка показывает, что скачаем именно его.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Загрузить',
      pause: 6400,
      say: 'Нажимаем «Загрузить» — приложение скачает курс и добавит его в ваши.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Знакомство (Ru-En)',
      pause: 5100,
      say: 'Открываем загруженный курс, чтобы посмотреть уроки.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Курс готов: уроки перед вами.',
      voice: NARRATOR,
      sayDelay: 400,
      wait: 4000,
    },
  ],
};
