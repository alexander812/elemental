/**
 * English version of "Getting to know Lexi" — English UI, an English user learning
 * Russian (course "Acquaintance", En-Ru). Three narrated steps:
 *   1. Load a ready-made course → open its lessons.
 *   2. Open "New Neighbors" → set "Good morning" → text → cards:
 *      listen, check pronunciation, flip, swipe. Three words learned, "кухня" missed.
 *   3. Test: English prompts, Russian answers — 4/4.
 *
 * No tooltips: the narrator explains every action, step cards separate the stages.
 * Pauses are measured for the English narrator (say + ~0.8 s).
 *
 * Audio: narrator — edge en-US-GuyNeural; Russian app voice — edge ru-RU-SvetlanaNeural;
 * the learner's answers in the test — edge ru-RU-DmitryNeural.
 *
 * Publication:
 *   TUT_OUT=... node skills/new-video/engine/audio.cjs overview --trim=auto --poster=0.6 \
 *     --to=app/public/videos/en
 */

const NARRATOR = 'edge:en-US-GuyNeural';
const APP_VOICE = 'edge:ru-RU-SvetlanaNeural';
const USER_VOICE = 'edge:ru-RU-DmitryNeural';

const trimSetToFourCards = () => {
  const key = 'app.sets';
  const envelope = JSON.parse(localStorage.getItem(key));
  const set = envelope.data.find((item) => item.name === 'Good morning');

  if (!set) return 'set "Good morning" not found';

  set.cards = set.cards.slice(0, 4);
  localStorage.setItem(key, JSON.stringify(envelope));

  return `cards in the set: ${set.cards.length}`;
};

module.exports = {
  name: 'overview',

  seed: {
    courses: [],
    lessons: [],
    sets: [],
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
    // --- Step 1: load a ready-made course ---
    { wait: 900 },
    {
      scene: { title: 'Step 1', text: "Let's start by loading a ready-made course." },
      pause: 7000,
      say: "Let's start by loading a ready-made course — you don't have to create one yourself.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Add course',
      pause: 4000,
      say: 'Open the add-course menu.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Find a ready-made course',
      pause: 5400,
      say: 'Choose “Find a ready-made course” to open the catalog.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Acquaintance',
      pause: 6200,
      say: 'Select the “Acquaintance” course — the check mark shows what will be loaded.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Load',
      pause: 6200,
      say: 'Tap “Load”: the app downloads the course and adds it to your library.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { eval: trimSetToFourCards },
    {
      tap: 'Acquaintance (En-Ru)',
      pause: 4500,
      say: 'Open the course to see its lessons.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'The course is ready — the lessons are in front of you.',
      voice: NARRATOR,
      sayDelay: 400,
      wait: 4700,
    },

    // --- Step 2: go through the set ---
    { wait: 700 },
    {
      scene: {
        title: 'Step 2',
        text: 'Open “New Neighbors” and go through the card set.',
      },
      pause: 5000,
      say: "Let's open the lesson and work through the cards.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'New Neighbors',
      pause: 5200,
      say: 'This is the lesson: here is the list of sets.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Good morning',
      pause: 5200,
      say: 'Choose the “Good morning” set to open its text.',
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
      say: 'The set builds cards from this text — they help you learn the unfamiliar words and phrases.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6600,
    },
    {
      tap: 'Next',
      pause: 3800,
      say: "Let's go to the cards.",
      voice: NARRATOR,
      sayDelay: 500,
    },

    // Card 1: доброе утро / good morning
    {
      say: 'Listen to the word — this is how you remember how it sounds.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 5400,
    },
    { say: 'доброе утро', sayLang: 'ru', voice: APP_VOICE, sayDelay: 600, tap: 'Speak', pause: 3600 },
    {
      speech: 'доброе утро',
      speechDelay: 1100,
      tap: 'Check pronunciation',
      pause: 6600,
      say: 'Now check your pronunciation: say the word into the microphone.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'доброе утро',
      touch: true,
      pause: 5000,
      say: 'Tap the card to flip it and see the translation.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      swipe: { target: 'доброе утро', dir: 'left' },
      pause: 4300,
      say: 'Swipe left — the word is learned.',
      voice: NARRATOR,
      sayDelay: 500,
    },

    // Card 2: просыпаться / to wake up
    {
      say: 'Listen to the next word.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 3900,
    },
    { say: 'просыпаться', sayLang: 'ru', voice: APP_VOICE, sayDelay: 600, tap: 'Speak', pause: 3300 },
    {
      speech: 'просыпаться',
      speechDelay: 1000,
      tap: 'Check pronunciation',
      pause: 4800,
      say: 'Say it and check.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'просыпаться',
      touch: true,
      pause: 3500,
      say: 'Flip the card.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    {
      swipe: { target: 'просыпаться', dir: 'left' },
      pause: 3700,
      say: 'Learned — swipe left.',
      voice: NARRATOR,
      sayDelay: 400,
    },

    // Card 3: кухня / kitchen — say a different word on purpose
    {
      say: 'Listen to the third word.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 3900,
    },
    { say: 'кухня', sayLang: 'ru', voice: APP_VOICE, sayDelay: 600, tap: 'Speak', pause: 3300 },
    {
      speech: 'банан',
      speechDelay: 1100,
      tap: 'Check pronunciation',
      pause: 5900,
      say: 'This time, say a different word on purpose.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    {
      tap: 'кухня',
      touch: true,
      pause: 4500,
      say: 'Flip the card to see the translation.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    {
      swipe: { target: 'кухня', dir: 'right' },
      pause: 5900,
      say: 'Swipe right — the card stays unlearned, so you can repeat it later.',
      voice: NARRATOR,
      sayDelay: 500,
    },

    // Card 4: кофе / coffee
    {
      say: 'The last word — listen.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 3900,
    },
    { say: 'кофе', sayLang: 'ru', voice: APP_VOICE, sayDelay: 600, tap: 'Speak', pause: 3300 },
    {
      speech: 'кофе',
      speechDelay: 1000,
      tap: 'Check pronunciation',
      pause: 4600,
      say: 'Say it correctly.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    { tap: 'кофе', touch: true, pause: 3500, say: 'Flip the card.', voice: NARRATOR, sayDelay: 400 },
    {
      swipe: { target: 'кофе', dir: 'left' },
      pause: 3700,
      say: 'Swipe left — learned.',
      voice: NARRATOR,
      sayDelay: 400,
    },
    {
      say: 'Three words learned, one left for later.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 4700,
    },

    // --- Step 3: test ---
    { wait: 700 },
    {
      scene: { title: 'Step 3', text: "Let's take the test on these words." },
      pause: 4500,
      say: "Let's take the test on these words.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Test',
      pause: 6000,
      say: 'In the test, the words are shown in English — say the Russian word.',
      voice: NARRATOR,
      sayDelay: 500,
    },
    { say: 'Say the first word.', voice: NARRATOR, sayDelay: 300, wait: 3600 },
    {
      say: 'доброе утро',
      sayLang: 'ru',
      voice: USER_VOICE,
      sayDelay: 600,
      speech: 'доброе утро',
      speechDelay: 1000,
      tap: 'Check pronunciation',
      pause: 3800,
    },
    {
      say: 'просыпаться',
      sayLang: 'ru',
      voice: USER_VOICE,
      sayDelay: 600,
      speech: 'просыпаться',
      speechDelay: 1000,
      tap: 'Check pronunciation',
      pause: 3600,
    },
    {
      say: 'кухня',
      sayLang: 'ru',
      voice: USER_VOICE,
      sayDelay: 600,
      speech: 'кухня',
      speechDelay: 1000,
      tap: 'Check pronunciation',
      pause: 3600,
    },
    {
      say: 'кофе',
      sayLang: 'ru',
      voice: USER_VOICE,
      sayDelay: 600,
      speech: 'кофе',
      speechDelay: 1000,
      tap: 'Check pronunciation',
      pause: 3600,
    },
    {
      say: 'The test is complete — all answers are correct!',
      voice: NARRATOR,
      sayDelay: 400,
      wait: 4700,
    },
  ],
}
