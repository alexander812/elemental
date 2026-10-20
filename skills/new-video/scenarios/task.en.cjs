/**
 * English version of "Working with sets" — English UI, an English user learning
 * Russian (course "Acquaintance", En-Ru). Three narrated steps:
 *   1. A ready-made set: the text is the main part, the cards teach its words;
 *      hold a word to translate it, switch the text to English.
 *   2. Create a set from a scanned Russian text: name, scan, pick words,
 *      translate them, apply.
 *   3. Test in auto mode: the app listens and checks the Russian answers.
 *
 * Mock Android bridge: scan text, speech recognition queue for auto mode.
 * Translation stub: ru → en dictionary.
 *
 * Publication:
 *   node skills/new-video/engine/audio.cjs task --trim=auto --poster=0.6 \
 *     --to=app/public/videos/en
 */

const NARRATOR = 'edge:en-US-GuyNeural';
const USER_VOICE = 'edge:ru-RU-DmitryNeural';

// Text that the mocked camera "scans".
const SCANNED_TEXT =
  'В субботу утром Картеры остаются дома. Миссис Картер печёт блины и заваривает чай. ' +
  'Мистер Картер читает газету на кухне. Джордж играет с мячом во дворе. ' +
  'Эмили рисует свою кошку. После обеда семья идёт в зоопарк. ' +
  'Обезьяны смешные, а слоны огромные. Все возвращаются домой счастливые и усталые.';

// Words from the text that we mark for learning (in order of appearance).
const STUDY_WORDS = ['блины', 'газету', 'дворе', 'обезьяны', 'слоны'];

// Translation stub (ru → en), including the word translated by holding it.
const TRANSLATIONS = {
  подоконник: 'windowsill',
  подоконнике: 'windowsill',
  блины: 'pancakes',
  газету: 'newspaper',
  дворе: 'yard',
  обезьяны: 'monkeys',
  слоны: 'elephants',
};

const nativeBridgeMock = (payload) => {
  const { scannedText, studyWords } = payload;
  const queue = [...studyWords];

  const respond = (requestId, data) =>
    window.__nativeBridgeResolve(requestId, JSON.stringify({ ok: true, data }));

  const installedArtifact = {
    id: 'offline-ru',
    title: 'Russian',
    description: 'Offline recognition',
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

const SET_TEXT_RU =
  'Сейчас семь часов утра. Наша семья живёт на пятом этаже. Мама Анна уже на кухне. ' +
  'Она варит кофе и улыбается. Папа Дмитрий читает новости и пьёт чай. Старший сын Макс ' +
  'убегает на пробежку в парк. Маша рисует за столом. Младший сын Тёма просыпается позже всех. ' +
  'Он приходит на кухню и говорит: «Доброе утро, всем!» Пёс Рекс вскакивает и виляет хвостом. ' +
  'Кошка Мурка спит на подоконнике. «Доброе утро, Мурка!» — говорит Тёма. «Просыпайся! Завтрак готов!»';

const SET_TEXT_EN =
  "It is seven o'clock in the morning. Our family lives on the fifth floor. Mother Emma is already " +
  'in the kitchen. She makes coffee and smiles. Father David reads the news and drinks his tea. ' +
  'Jack, the older son, goes running in the park. Sophie draws at the table. Little Ollie wakes up ' +
  'last. He comes to the kitchen and says: Good morning, everybody! The dog Buddy jumps up and wags ' +
  'his tail. The cat Bella sleeps on the windowsill. Good morning, Bella! says Ollie. Wake up! ' +
  'Breakfast is ready!';

module.exports = {
  name: 'task',

  initScripts: [{ fn: nativeBridgeMock, arg: { scannedText: SCANNED_TEXT, studyWords: STUDY_WORDS } }],
  routes: [translateStub(TRANSLATIONS)],

  seed: {
    courses: [
      {
        id: 'c1',
        name: 'Acquaintance',
        description:
          'New neighbors: meet the family and the Carters — greetings, introductions, tea and small talk.',
        order: 0,
        lang: 'ru',
        level: 'beginner',
        userLang: 'en',
      },
    ],
    lessons: [{ id: 'l1', courseId: 'c1', name: 'New Neighbors', order: 0 }],
    sets: [
      {
        id: 's1',
        lessonId: 'l1',
        name: 'Good morning',
        active: true,
        order: 0,
        swapped: false,
        examPassed: false,
        texts: { ru: SET_TEXT_RU, en: SET_TEXT_EN },
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
      userLang: 'en',
      learnAfterChecks: false,
      voiceCheckEnabled: true,
      writeCheckEnabled: false,
      debugMode: false,
    },
  },

  steps: [
    // --- Step 1: the text is the main part ---
    { wait: 900 },
    {
      scene: { title: 'Step 1', text: "Let's look at a set: its text and its cards." },
      pause: 5000,
      say: "Let's look at a set: its text and its cards.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Acquaintance (En-Ru)',
      pause: 4200,
      say: 'Open the “Acquaintance” course.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'New Neighbors',
      pause: 4200,
      say: 'Go to the “New Neighbors” lesson.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Good morning',
      pause: 4200,
      say: 'Open the “Good morning” set.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'This is the set text. The main goal is to read and understand it.',
      voice: NARRATOR,
      sayDelay: 400,
      wait: 6800,
    },
    {
      say: 'An unfamiliar word can be translated without leaving the set: press and hold it.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6500,
    },
    { hold: { target: 'подоконник', ms: 3200 }, pause: 1000 },
    {
      tap: 'English',
      pause: 5400,
      say: 'The text can be switched to English and read in your language.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Next',
      pause: 6000,
      say: "Now let's look at the cards: they are built from the words and phrases in this text.",
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Once you learn the cards, you will understand the text without translation.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6200,
    },
    {
      back: true,
      pause: 4800,
      say: "Let's go back to the lesson and create our own set.",
      voice: NARRATOR,
      sayDelay: 500,
    },

    // --- Step 2: own set from a scanned text ---
    { wait: 700 },
    {
      scene: {
        title: 'Step 2',
        text: "Let's create our own set: scan a text and choose words.",
      },
      pause: 5400,
      say: "Let's create our own set: scan a text and choose words to learn.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Add set',
      pause: 4200,
      say: 'You can add your own set to the lesson.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      type: { target: 'Name', text: 'Saturday morning', delay: 60 },
      pause: 3600,
      say: 'Give the set a name.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Tap to add text',
      pause: 3800,
      say: 'Now add the set text.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Add text',
      pause: 5000,
      say: 'You can paste, dictate, or scan the text.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Scan text',
      pause: 5800,
      say: 'Scan it: the app recognizes text from the camera.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Save',
      pause: 4200,
      say: 'The text is recognized — save it.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'блины',
      pause: 5400,
      say: 'Mark the unfamiliar words: they will become cards.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    { tap: 'газету', pause: 900 },
    { tap: 'дворе', pause: 900 },
    { tap: 'обезьяны', pause: 900 },
    { tap: 'слоны', pause: 1200 },
    {
      tap: 'Create cards',
      pause: 4200,
      say: 'Create cards from the selected words.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Set menu',
      pause: 900,
    },
    {
      tap: 'Translate all',
      pause: 6200,
      say: "Let's translate the words: the app will fill in the translations.",
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'Apply',
      pause: 4000,
      say: 'The set is ready — apply it.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      say: 'The set is created: cards with words from our text.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 5300,
    },

    // --- Step 3: auto test ---
    { wait: 700 },
    {
      scene: { title: 'Step 3', text: "Let's take the test in auto mode." },
      pause: 4800,
      say: "Let's take the test in auto mode.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Test',
      pause: 8000,
      say: 'You can answer manually, or turn on auto mode — the app listens and checks by itself.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    // Auto mode checks about every 2.46 s; the learner answers in Russian.
    {
      tap: 'Start auto mode',
      pause: 900,
      say: 'блины',
      sayLang: 'ru',
      voice: USER_VOICE,
      sayDelay: 1500,
    },
    { wait: 2460, say: 'газету', sayLang: 'ru', voice: USER_VOICE, sayDelay: 2560 },
    { wait: 2460, say: 'дворе', sayLang: 'ru', voice: USER_VOICE, sayDelay: 2560 },
    { wait: 2460, say: 'обезьяны', sayLang: 'ru', voice: USER_VOICE, sayDelay: 2560 },
    { wait: 2460, say: 'слоны', sayLang: 'ru', voice: USER_VOICE, sayDelay: 2560 },
    {
      say: 'The test is complete — all answers are correct!',
      voice: NARRATOR,
      sayDelay: 2000,
      wait: 5000,
    },
  ],
}
