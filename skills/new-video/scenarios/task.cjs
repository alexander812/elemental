/**
 * Ролик «Работа с заданиями» (task) — три шага, всё озвучивает диктор (без тултипов):
 *   1. Разбираем готовое задание: текст на первом экране — главный, карточки учат
 *      слова и выражения, чтобы читать и понимать текст. Показываем перевод слова
 *      по удержанию и переключение текста на русский.
 *   2. Создаём своё задание: название, «Сканировать текст» (мок нативного моста),
 *      отмечаем незнакомые слова, переводим и применяем.
 *   3. Тест в автоматическом режиме: приложение само слушает и проверяет ответы.
 *
 * Особенности:
 * - `initScripts` поднимает мок Android-моста: рисует «Сканировать текст»,
 *   отдаёт распознанный текст, отвечает на распознавание речи (авто-очередь слов).
 * - `routes` подменяет переводилку (translate.googleapis.com) на словарь.
 * - `hold` — длинное нажатие по слову: тултип с переводом.
 *
 * Публикация:
 *   node skills/new-video/engine/audio.cjs task --trim=auto --webm --poster=0.6 --to=app/public/videos
 */

const NARRATOR = 'edge:ru-RU-DmitryNeural';

// Текст, который «сканирует» мок камеры.
const SCANNED_TEXT =
  'On Saturday morning the Carters stay at home. Mrs Carter makes pancakes and tea. ' +
  'Mr Carter reads a newspaper in the kitchen. George plays with his ball in the yard. ' +
  'Emily draws a picture of her cat. After lunch the family goes to the zoo. ' +
  'The monkeys are funny and the elephants are huge. Everyone comes home happy and tired.';

// Слова из текста, которые отмечаем для изучения (в порядке появления).
const STUDY_WORDS = ['pancakes', 'newspaper', 'yard', 'monkeys', 'elephants'];

// Словарь для подмены перевода (en → ru) и слов для перевода по удержанию.
const TRANSLATIONS = {
  windowsill: 'подоконник',
  pancakes: 'блины',
  newspaper: 'газета',
  yard: 'двор',
  monkeys: 'обезьяны',
  elephants: 'слоны',
};

const nativeBridgeMock = (payload) => {
  const { scannedText, studyWords } = payload;
  const queue = [...studyWords];

  const respond = (requestId, data) =>
    window.__nativeBridgeResolve(requestId, JSON.stringify({ ok: true, data }));

  const installedArtifact = {
    id: 'offline-en',
    title: 'Английский',
    description: 'Офлайн-распознавание',
    sizeBytes: 0,
    languages: ['en', 'ru'],
    installed: true,
    downloading: false,
    progress: 1,
    error: null,
  };

  window.AndroidBridge = {
    hasRecognition: () => true,
    finishScan: () => undefined,
    call: (requestId, method, paramsJson) => {
      if (method === 'scanText') {
        respond(requestId, { text: scannedText, confidence: 0.97, cancelled: false });
        return;
      }

      if (method === 'asrStatus') {
        respond(requestId, { artifacts: [installedArtifact] });
        return;
      }

      if (method === 'recognizeSpeech') {
        const transcript = window.__speech.transcript || queue.shift() || '';
        respond(requestId, { alternatives: [transcript], confidence: 0.95, transcript });
        return;
      }

      respond(requestId, null);
    },
  };
};

const translateStub = (translations) => ({
  pattern: '**/translate_a/single**',
  respond: (url) => {
    const query = (new URL(url).searchParams.get('q') ?? '').trim();
    const translated = translations[query.toLowerCase()] ?? query;

    return [[[translated, query, null, null]]];
  },
});

const CARDS = [
  ['доброе утро', 'good morning'],
  ['просыпаться', 'to wake up'],
  ['кухня', 'kitchen'],
  ['кофе', 'coffee'],
  ['чашка горячего чая', 'a cup of tea'],
  ['улыбаться', 'to smile'],
  ['собака', 'the dog Buddy'],
  ['кошка', 'the cat Bella'],
  ['подоконник', 'windowsill'],
  ['завтрак', 'breakfast'],
];

module.exports = {
  name: 'task',

  initScripts: [{ fn: nativeBridgeMock, arg: { scannedText: SCANNED_TEXT, studyWords: STUDY_WORDS } }],
  routes: [translateStub(TRANSLATIONS)],

  seed: {
    courses: [
      {
        id: 'c1',
        name: 'Знакомство',
        description:
          'Новые соседи: знакомимся с семьёй и Картерами — приветствия, представление, чай и лёгкая беседа.',
        order: 0,
        lang: 'en',
        level: 'beginner',
      },
    ],
    lessons: [{ id: 'l1', courseId: 'c1', name: 'Новые соседи', order: 0 }],
    sets: [
      {
        id: 's1',
        lessonId: 'l1',
        name: 'Доброе утро',
        active: true,
        order: 0,
        swapped: false,
        examPassed: false,
        texts: {
          ru: 'Сейчас семь часов утра. Наша семья живёт на пятом этаже. Мама Анна уже на кухне. Она варит кофе и улыбается. Папа Дмитрий читает новости и пьёт чай. Старший сын Макс убегает на пробежку в парк. Маша рисует за столом. Младший сын Тёма просыпается позже всех. Он приходит на кухню и говорит: «Доброе утро, всем!» Пёс Рекс вскакивает и виляет хвостом. Кошка Мурка спит на подоконнике. «Доброе утро, Мурка!» — говорит Тёма. «Просыпайся! Завтрак готов!»',
          en: "It is seven o'clock in the morning. Our family lives on the fifth floor. Mother Emma is already in the kitchen. She makes coffee and smiles. Father David reads the news and drinks his tea. Jack, the older son, goes running in the park. Sophie draws at the table. Little Ollie wakes up last. He comes to the kitchen and says: Good morning, everybody! The dog Buddy jumps up and wags his tail. The cat Bella sleeps on the windowsill. Good morning, Bella! says Ollie. Wake up! Breakfast is ready!",
        },
        cards: CARDS.map(([ru, en], index) => ({
          id: `k${index + 1}`,
          texts: { ru, en },
          learned: false,
          deleted: false,
          voiceCheck: null,
          writeCheck: null,
        })),
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
    // --- Шаг 1: текст задания — главное в задании ---
    { wait: 900 },
    {
      scene: { title: 'Шаг 1', text: 'Разберём задание: текст и карточки.' },
      pause: 1200,
      say: 'Разберём задание: текст и карточки.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Знакомство (Ru-En)',
      pause: 4300,
      say: 'Открываем курс «Знакомство».',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Новые соседи',
      pause: 4500,
      say: 'Заходим в урок «Новые соседи».',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Доброе утро',
      pause: 4600,
      say: 'Открываем задание «Доброе утро».',
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
      say: 'Незнакомое слово можно перевести, не выходя из задания: нажмите на него и удерживайте.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6800,
    },
    { hold: { target: 'windowsill', ms: 3200 }, pause: 900 },
    {
      tap: 'Русский',
      pause: 5000,
      say: 'Текст легко переключить на русский и читать по-русски.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Далее',
      pause: 6300,
      say: 'Посмотрим карточки: они созданы из слов и выражений этого текста.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Выучив карточки, вы будете понимать текст без перевода.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 5200,
    },
    {
      back: true,
      pause: 4700,
      say: 'Вернёмся к уроку и создадим своё задание.',
      voice: NARRATOR,
      sayDelay: 500,
    },

    // --- Шаг 2: своё задание из своего текста ---
    { wait: 700 },
    {
      scene: {
        title: 'Шаг 2',
        text: 'Создадим своё задание: отсканируем текст и выберем слова.',
      },
      pause: 1600,
      say: 'Создадим своё задание: отсканируем текст и выберем слова для изучения.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Добавить задание',
      pause: 4300,
      say: 'В уроке можно добавить своё задание.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      type: { target: 'Название', text: 'Субботнее утро', delay: 60 },
      pause: 3600,
      say: 'Даём задание название.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Нажмите чтобы добавить текст',
      pause: 4000,
      say: 'Теперь добавим текст задания.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Добавить текст',
      pause: 5100,
      say: 'Текст можно вставить, надиктовать или отсканировать.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Сканировать текст',
      pause: 6500,
      say: 'Сканируем: приложение распознает текст с камеры.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Сохранить',
      pause: 3900,
      say: 'Текст распознан — сохраняем.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'pancakes',
      pause: 5500,
      say: 'Отмечаем незнакомые слова — из них создадутся карточки.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    { tap: 'newspaper', pause: 900 },
    { tap: 'yard', pause: 900 },
    { tap: 'monkeys', pause: 900 },
    { tap: 'elephants', pause: 1200 },
    {
      tap: 'Создать карточки',
      pause: 4300,
      say: 'Создаём карточки из выбранных слов.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Меню задания',
      pause: 900,
    },
    {
      tap: 'Перевести всё',
      pause: 6500,
      say: 'Переведём слова: приложение подставит переводы.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Применить',
      pause: 4200,
      say: 'Задание готово — применяем.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      say: 'Задание создано: карточки со словами из нашего текста.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 5300,
    },

    // --- Шаг 3: тест в автоматическом режиме ---
    { wait: 700 },
    {
      scene: { title: 'Шаг 3', text: 'Пройдём тест в автоматическом режиме.' },
      pause: 1200,
      say: 'Пройдём тест в автоматическом режиме.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Тест',
      pause: 8600,
      say: 'В тесте можно отвечать вручную, а можно включить автоматический режим — приложение само слушает и проверяет.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    // Автоматический режим: проверки идут раз в ~2,46 с; слова отвечает «пользователь»
    // (Daniel), тайминги рассчитаны от старта этого шага.
    {
      tap: 'Запустить автоматический режим',
      pause: 900,
      say: 'pancakes',
      sayLang: 'en',
      voice: 'Daniel',
      sayDelay: 1500,
    },
    { wait: 2460, say: 'newspaper', sayLang: 'en', voice: 'Daniel', sayDelay: 2560 },
    { wait: 2460, say: 'yard', sayLang: 'en', voice: 'Daniel', sayDelay: 2560 },
    { wait: 2460, say: 'monkeys', sayLang: 'en', voice: 'Daniel', sayDelay: 2560 },
    { wait: 2460, say: 'elephants', sayLang: 'en', voice: 'Daniel', sayDelay: 2560 },
    {
      say: 'Тест пройден — все ответы верные!',
      voice: NARRATOR,
      sayDelay: 2000,
      wait: 5000,
    },
  ],
};
