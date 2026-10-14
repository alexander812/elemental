/**
 * Общий ролик «Знакомство с Lexi» — три шага, всё озвучивает диктор:
 *   1. Загрузка готового курса «Знакомство» → переход на курс со списком уроков.
 *   2. Урок «Новые соседи» → задание «Доброе утро» → текст задания → карточки:
 *      озвучка, проверка произношения, переворот, свайп. 3 слова верно,
 *      третье («kitchen») произносим неверно → остаётся в невыученных.
 *   3. Тест по заданию: все ответы верные → экран результатов.
 *
 * Тултипов нет: действия комментирует диктор (что делаем и зачем), этапы
 * разделяют карточки-титры «Шаг N». Паузы подогнаны под длину реплик
 * (реплика + ~0,8 с).
 *
 * Звук: записи звука в браузере нет — реплики `say` подмешиваются в mp4 при сборке.
 * Озвучка слов — голосом приложения (Samantha), проговаривание в тесте — Daniel,
 * пояснения диктора — нейросетевой голос edge-tts (NARRATOR = ru-RU-DmitryNeural).
 *
 * Для ролика задание и тест ограничены 4 карточками: шаг `eval` после загрузки
 * курса обрезает карточки задания «Доброе утро» до первых четырёх.
 *
 * Стартовое состояние — свежая установка: курсов нет, онбординг пройден
 * (движок сам ставит app.onboarding, если в seed его нет).
 *
 * Публикация:
 *   node skills/new-video/engine/audio.cjs overview --trim=auto --webm --poster=0.6 --to=app/public/videos
 */

const NARRATOR = 'edge:ru-RU-DmitryNeural';

const trimSetToFourCards = () => {
  const key = 'app.sets';
  const envelope = JSON.parse(localStorage.getItem(key));
  const set = envelope.data.find((item) => item.name === 'Доброе утро');

  if (!set) return 'задание «Доброе утро» не найдено';

  set.cards = set.cards.slice(0, 4);
  localStorage.setItem(key, JSON.stringify(envelope));

  return `карточек в задании: ${set.cards.length}`;
};

module.exports = {
  name: 'overview',

  seed: {
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
    // --- Шаг 1: загружаем готовый курс ---
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
    { eval: trimSetToFourCards },
    {
      tap: 'Знакомство (Ru-En)',
      pause: 5100,
      say: 'Открываем загруженный курс, чтобы посмотреть уроки.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { say: 'Курс готов: уроки перед вами.', voice: NARRATOR, sayDelay: 400, wait: 4000 },

    // --- Шаг 2: проходим задание ---
    { wait: 700 },
    {
      scene: {
        title: 'Шаг 2',
        text: 'Откроем урок «Новые соседи» и пройдём задание по карточкам.',
      },
      pause: 600,
      say: 'Откроем урок и пройдём задание по карточкам.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Новые соседи',
      pause: 4500,
      say: 'Открываем урок — здесь список заданий.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Доброе утро',
      pause: 5500,
      say: 'Выбираем задание «Доброе утро»: откроется его текст.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Перед вами текст задания. Основная задача — научиться читать и понимать этот текст.',
      voice: NARRATOR,
      sayDelay: 400,
      wait: 8000,
    },
    {
      say: 'На основе этого текста задание создаёт карточки — они помогут выучить все незнакомые слова и выражения.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 7900,
    },
    {
      tap: 'Далее',
      pause: 3200,
      say: 'Переходим к карточкам.',
      voice: NARRATOR,
      sayDelay: 500,
    },

    // Карточка 1: good morning
    {
      say: 'Слушаем слово — так запоминается его звучание.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 4600,
    },
    { say: 'good morning', sayLang: 'en', sayDelay: 600, tap: 'Озвучить', pause: 1500 },
    {
      speech: 'good morning',
      speechDelay: 1100,
      tap: 'Проверить произношение',
      pause: 5000,
      say: 'Проверяем произношение: скажите слово в микрофон.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'good morning',
      touch: true,
      pause: 5000,
      say: 'Тап по карточке переворачивает её — видим перевод.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      swipe: { target: 'good morning', dir: 'left' },
      pause: 4100,
      say: 'Свайп влево — слово выучено.',
      voice: NARRATOR,
      sayDelay: 500,
    },

    // Карточка 2: to wake up
    {
      say: 'Слушаем следующее слово.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 3300,
    },
    { say: 'to wake up', sayLang: 'en', sayDelay: 600, tap: 'Озвучить', pause: 1500 },
    {
      speech: 'to wake up',
      speechDelay: 1000,
      tap: 'Проверить произношение',
      pause: 3500,
      say: 'Произносим и проверяем.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'to wake up',
      touch: true,
      pause: 2700,
      say: 'Переворачиваем.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    {
      swipe: { target: 'to wake up', dir: 'left' },
      pause: 3800,
      say: 'Выучено — свайп влево.',
      voice: NARRATOR,
      sayDelay: 400,
    },

    // Карточка 3: kitchen — произносим неверно и возвращаем в невыученные.
    // «kitchen» проверяется строго (в отличие от «coffee»: удвоения сжимаются
    // до короткого слова, и любое услышанное слово проходит проверку).
    // Микрофон и озвучка — только на лицевой стороне, переворот делаем после проверки.
    {
      say: 'Слушаем третье слово.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 3100,
    },
    { say: 'kitchen', sayLang: 'en', sayDelay: 600, tap: 'Озвучить', pause: 1500 },
    {
      speech: 'banana',
      speechDelay: 1100,
      tap: 'Проверить произношение',
      pause: 4700,
      say: 'Проверим ещё раз — произнесём слово неверно.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'kitchen',
      touch: true,
      pause: 3900,
      say: 'Переворачиваем — смотрим перевод.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    {
      swipe: { target: 'kitchen', dir: 'right' },
      pause: 6300,
      say: 'Свайп вправо — карточка остаётся в невыученных, повторим её позже.',
      voice: NARRATOR,
      sayDelay: 500,
    },

    // Карточка 4: coffee — произносим верно
    {
      say: 'Последнее слово — слушаем.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 3400,
    },
    { say: 'coffee', sayLang: 'en', sayDelay: 600, tap: 'Озвучить', pause: 1500 },
    {
      speech: 'coffee',
      speechDelay: 1000,
      tap: 'Проверить произношение',
      pause: 3100,
      say: 'Произносим верно.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    { tap: 'coffee', touch: true, pause: 2700, say: 'Переворачиваем.', voice: NARRATOR, sayDelay: 400 },
    {
      swipe: { target: 'coffee', dir: 'left' },
      pause: 3800,
      say: 'Свайп влево — выучено.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    {
      say: 'Три слова выучено, одно — в невыученных. Его можно повторить позже.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 7400,
    },

    // --- Шаг 3: тест ---
    { wait: 700 },
    {
      scene: { title: 'Шаг 3', text: 'Пройдём тест по этим словам.' },
      pause: 600,
      say: 'Пройдём тест по этим словам.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Тест',
      pause: 5800,
      say: 'В тесте слова показываются по-русски — произносите английские.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    // В тесте нет кнопки «Озвучить»: проговаривание слов добавляем в дорожку
    // (голос Daniel, чтобы отличать от озвучки приложения — Samantha).
    { say: 'Скажите первое слово.', voice: NARRATOR, sayDelay: 300, wait: 3200 },
    { say: 'good morning', sayLang: 'en', voice: 'Daniel', sayDelay: 600, speech: 'good morning', speechDelay: 1000, tap: 'Проверить произношение', pause: 3200 },
    { say: 'to wake up', sayLang: 'en', voice: 'Daniel', sayDelay: 600, speech: 'to wake up', speechDelay: 1000, tap: 'Проверить произношение', pause: 3200 },
    { say: 'kitchen', sayLang: 'en', voice: 'Daniel', sayDelay: 600, speech: 'kitchen', speechDelay: 1000, tap: 'Проверить произношение', pause: 3200 },
    { say: 'coffee', sayLang: 'en', voice: 'Daniel', sayDelay: 600, speech: 'coffee', speechDelay: 1000, tap: 'Проверить произношение', pause: 3200 },
    {
      say: 'Тест пройден — все ответы верные!',
      voice: NARRATOR,
      sayDelay: 400,
      wait: 4200,
    },
  ],
};
