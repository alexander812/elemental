/**
 * English version of "Settings and data" — English UI, an English user learning
 * Russian (course "Acquaintance", En-Ru). Three narrated steps:
 *   1. Settings sections: Language, Checks, Knowledge base, About — what each does.
 *   2. Theme: switch to Light, Terracotta, Amethyst, then back to Dark.
 *   3. "Data" in detail: export a lesson to a file, show the import card and the reset sheet.
 *
 * Notes:
 * - The browser has no native file picker, so the backup file is put into the hidden
 *   input[type=file] via DataTransfer (eval step). The format version is read from
 *   app/src/transport/backup.ts, so the scenario follows BACKUP_VERSION changes.
 * - Export is real: the file is downloaded and the app returns to "Data" (popScreen).
 * - Voice section is not shown: it exists only on Android and no voices are downloaded.
 * - The real import and reset are not completed: import would navigate to "Courses",
 *   reset would reload the app. We show the file card and the confirmation sheet, then Cancel.
 *
 * Publication:
 *   node skills/new-video/engine/audio.cjs settings --trim=auto --poster=0.6 \
 *     --to=app/public/videos/en
 */

const fs = require('fs');
const path = require('path');

const NARRATOR = 'edge:en-US-GuyNeural';

// Backup format version — the same value parseBackup reads (transport/backup.ts).
const readBackupVersion = () => {
  try {
    const source = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'app/src/transport/backup.ts'),
      'utf8'
    );
    const match = source.match(/BACKUP_VERSION = (\d+)/);

    if (match) return Number(match[1]);
  } catch {
    /* keep the default */
  }

  return 7;
};

const CARDS = {
  morning: [
    ['good morning', 'доброе утро'],
    ['to wake up', 'просыпаться'],
    ['kitchen', 'кухня'],
    ['coffee', 'кофе'],
  ],
  name: [
    ['What is your name?', 'Как тебя зовут?'],
    ['My name is…', 'Меня зовут…'],
  ],
};

const makeCards = (pairs, prefix) =>
  pairs.map(([en, ru], index) => ({
    id: `${prefix}${index + 1}`,
    texts: { en, ru },
    learned: false,
    deleted: false,
    voiceCheck: null,
    writeCheck: null,
  }));

// State as after loading the ready-made course "Acquaintance" (En-Ru): two lessons, two sets.
const SEED = {
  courses: [
    {
      id: 'c1',
      name: 'Acquaintance',
      description:
        'New neighbors: meet the family and the Carters. Greetings, introductions, tea and small talk.',
      order: 0,
      lang: 'ru',
      userLang: 'en',
      level: 'beginner',
    },
  ],
  lessons: [
    { id: 'l1', courseId: 'c1', name: 'New Neighbors', order: 0 },
    { id: 'l2', courseId: 'c1', name: "Let's Get Acquainted", order: 1 },
  ],
  sets: [
    {
      id: 's1',
      lessonId: 'l1',
      name: 'Good morning',
      active: true,
      order: 0,
      swapped: false,
      examPassed: false,
      texts: {
        en: 'It is seven o’clock in the morning. Our family lives on the fifth floor. Mother Emma is already in the kitchen. She makes coffee and smiles.',
        ru: 'Сейчас семь часов утра. Наша семья живёт на пятом этаже. Мама Анна уже на кухне. Она варит кофе и улыбается.',
      },
      cards: makeCards(CARDS.morning, 'k'),
    },
    {
      id: 's2',
      lessonId: 'l2',
      name: 'What is your name?',
      active: true,
      order: 1,
      swapped: false,
      examPassed: false,
      texts: {
        en: '— Hello! Can I play with you? — Of course! What is your name? — My name is George. Nice to meet you!',
        ru: '— Привет! Можно с вами поиграть? — Конечно! Как тебя зовут? — Меня зовут Джордж. Приятно познакомиться!',
      },
      cards: makeCards(CARDS.name, 'm'),
    },
  ],
  settings: {
    theme: 'dark',
    userLang: 'en',
    learnAfterChecks: false,
    voiceCheckEnabled: true,
    writeCheckEnabled: false,
    debugMode: false,
    progressionEnabled: true,
  },
};

// Backup file for the import demo: same format version as the app.
const BACKUP_VERSION = readBackupVersion();
const BACKUP_FILE = `lexi-backup-${new Date().toISOString().slice(0, 10)}.json`;
const BACKUP_JSON = JSON.stringify({
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  courses: SEED.courses,
  lessons: SEED.lessons,
  sets: SEED.sets,
  languages: [],
  settings: SEED.settings,
});

// Put the file into the hidden input[type=file] — as if the user picked a backup.
const IMPORT_FILE_STEP = `(() => {
  const input = document.querySelector('input[type=file]');
  if (!input) return 'no file input';
  const file = new File([${JSON.stringify(BACKUP_JSON)}], ${JSON.stringify(BACKUP_FILE)}, {
    type: 'application/json',
  });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'file attached: ' + file.name;
})()`;

module.exports = {
  name: 'settings',

  seed: SEED,

  steps: [
    { wait: 900 },

    // --- Step 1: go through the settings sections ---
    {
      scene: { title: 'Step 1', text: 'Get to know the settings sections.' },
      pause: 3400,
      say: "Let's get to know the settings — this is where the app adapts to you.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Settings',
      pause: 4800,
      say: "Open Settings and we'll go through each section.",
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Language',
      pause: 5300,
      say: 'Language sets the language of translations and hints.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },
    {
      tap: 'Checks',
      pause: 5800,
      say: 'Checks decide how you train words: say them out loud or type them.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'And the “Move to learned” switch marks a word as learned right after a correct answer.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6000,
    },
    { back: true },
    {
      tap: 'Knowledge base',
      pause: 6300,
      say: 'If you forget something, the Knowledge base has video guides you can rewatch.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },
    {
      tap: 'About',
      pause: 7500,
      say: 'About shows the version and build date, and debug mode reveals what the model heard when a check fails.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },

    // --- Step 2: themes ---
    {
      scene: { title: 'Step 2', text: "Let's choose a theme." },
      pause: 3400,
      say: 'Now for the look: everyone picks a theme to their taste.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Theme',
      pause: 5200,
      say: 'There are six themes: light, dark and coloured.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Light',
      pause: 3700,
      say: 'Light is for daytime.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Terracotta',
      pause: 4600,
      say: 'Terracotta brings warm beige tones.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Amethyst',
      pause: 5000,
      say: 'Amethyst is a dark theme with purple accents.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Dark',
      pause: 4500,
      say: "Back to Dark — it's the default theme.",
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },

    // --- Step 3: the Data section ---
    {
      scene: { title: 'Step 3', text: 'A closer look at the Data section.' },
      pause: 3400,
      say: "Let's look at the Data section separately — it keeps your courses safe.",
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Data',
      pause: 5800,
      say: 'There are three actions here: export, import and reset.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Export',
      pause: 7400,
      say: 'Export saves the selected lessons to a file — for example, to move them to another device.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: "Let's Get Acquainted",
      pause: 5600,
      say: 'Choose which lessons go into the file: keep only “New Neighbors”.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Export',
      pause: 4600,
      say: 'Tap “Export” — the app saves the file.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'You can email the file to yourself or keep it in the cloud.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 5100,
    },
    {
      tap: 'Import',
      pause: 5600,
      say: 'Import is the reverse: choose a file with a copy of your data.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { eval: IMPORT_FILE_STEP },
    {
      say: "The app reads the file and shows what's inside: courses, lessons, sets and cards.",
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6800,
    },
    {
      say: '“Merge” adds the lessons from the file to the current ones, “Replace” completely replaces all the app data.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 7500,
    },
    {
      tap: 'Cancel',
      pause: 5400,
      say: 'Cancel the import — these lessons are already in the app.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Reset data',
      pause: 7000,
      say: 'Reset returns the app to its initial state — for example, if you want to start over.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Courses, lessons and settings will be deleted with no way to restore them, so the app asks for confirmation.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 7800,
    },
    {
      tap: 'Cancel',
      pause: 4300,
      say: 'Cancel — we still need our data.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Now you know where to tailor the app to yourself and how to save your courses to a file.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6100,
    },
  ],
};
