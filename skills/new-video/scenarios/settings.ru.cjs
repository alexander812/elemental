/**
 * Ролик «Настройки и данные» (settings) — три шага, всё озвучивает диктор (без тултипов):
 *   1. Разделы настроек: Язык, Проверки, База знаний, О приложении — что каждый делает.
 *   2. Тема оформления: переключаем Светлую, Терракоту, Аметист и возвращаем Тёмную.
 *   3. Раздел «Данные» подробно: экспорт урока в файл, показ карточки импорта и шита сброса.
 *
 * Особенности:
 * - Импорт в браузере показать нельзя (нет нативного выбора файла) — файл-бэкап подкладывается
 *   в скрытый input[type=file] через DataTransfer (eval-шаг). Версия формата читается из
 *   app/src/transport/backup.ts; если BACKUP_VERSION изменится, сценарий подхватит новую.
 * - Экспорт настоящий: файл скачивается, приложение само возвращается на «Данные» (popScreen).
 * - Озвучку языков (раздел «Озвучка») не показываем: в браузере его нет, голоса не скачиваем.
 * - Реальный импорт и сброс не доводим до конца: импорт увёл бы на «Курсы», сброс перезагрузил бы
 *   приложение. Показываем карточку файла и шит подтверждения, затем «Отмена».
 *
 * Публикация:
 *   node skills/new-video/engine/audio.cjs settings --trim=auto --poster=0.6 --to=app/public/videos/ru/ru
 */

const fs = require('fs');
const path = require('path');

const NARRATOR = 'edge:ru-RU-DmitryNeural';

// Версия формата бэкапа — та же, что читает parseBackup (transport/backup.ts).
const readBackupVersion = () => {
  try {
    const source = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'app/src/transport/backup.ts'),
      'utf8'
    );
    const match = source.match(/BACKUP_VERSION = (\d+)/);

    if (match) return Number(match[1]);
  } catch {
    /* остаётся значение по умолчанию */
  }

  return 7;
};

const CARDS = {
  morning: [
    ['доброе утро', 'good morning'],
    ['просыпаться', 'to wake up'],
    ['кухня', 'kitchen'],
    ['кофе', 'coffee'],
  ],
  name: [
    ['Как тебя зовут?', 'What is your name?'],
    ['Меня зовут…', 'My name is…'],
  ],
};

const makeCards = (pairs, prefix) =>
  pairs.map(([ru, en], index) => ({
    id: `${prefix}${index + 1}`,
    texts: { ru, en },
    learned: false,
    deleted: false,
    voiceCheck: null,
    writeCheck: null,
  }));

// Состояние как после загрузки готового курса «Знакомство»: два урока и два задания.
const SEED = {
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
  lessons: [
    { id: 'l1', courseId: 'c1', name: 'Новые соседи', order: 0 },
    { id: 'l2', courseId: 'c1', name: 'Давайте познакомимся', order: 1 },
  ],
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
        ru: 'Сейчас семь часов утра. Мама Анна уже на кухне — она варит кофе и улыбается.',
        en: 'It is seven o’clock in the morning. Mother Anna is already in the kitchen — she makes coffee and smiles.',
      },
      cards: makeCards(CARDS.morning, 'k'),
    },
    {
      id: 's2',
      lessonId: 'l2',
      name: 'Как тебя зовут?',
      active: true,
      order: 1,
      swapped: false,
      examPassed: false,
      texts: {
        ru: '— Как тебя зовут? — Меня зовут Маша. Приятно познакомиться!',
        en: 'What is your name? — My name is Masha. Nice to meet you!',
      },
      cards: makeCards(CARDS.name, 'm'),
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
};

// Файл-бэкап для показа импорта: та же версия формата, что у приложения.
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

// Подкладываем файл в скрытый input[type=file] — как будто пользователь выбрал бэкап в диалоге.
const IMPORT_FILE_STEP = `(() => {
  const input = document.querySelector('input[type=file]');
  if (!input) return 'нет поля для файла';
  const file = new File([${JSON.stringify(BACKUP_JSON)}], ${JSON.stringify(BACKUP_FILE)}, {
    type: 'application/json',
  });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'файл подложен: ' + file.name;
})()`;

module.exports = {
  name: 'settings',

  seed: SEED,

  steps: [
    { wait: 900 },

    // --- Шаг 1: проходим по разделам настроек ---
    {
      scene: { title: 'Шаг 1', text: 'Познакомимся с разделами настроек.' },
      pause: 3400,
      say: 'Познакомимся с настройками — здесь приложение подстраивается под вас.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Настройки',
      pause: 5200,
      say: 'Открываем настройки — пройдёмся по каждому разделу.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Язык',
      pause: 7200,
      say: 'Раздел «Язык» — здесь выбирают, на каком языке показывать переводы и подсказки.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },
    {
      tap: 'Проверки',
      pause: 6700,
      say: 'Проверки решают, как тренировать слова: произносить вслух или писать вручную.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'А свитч «Переносить в выученные» сразу отметит слово выученным после верного ответа.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 7400,
    },
    { back: true },
    {
      tap: 'База знаний',
      pause: 6600,
      say: 'Если что-то забыли — в «Базе знаний» можно пересмотреть видеоинструкции.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },
    {
      tap: 'О приложении',
      pause: 8900,
      say: '«О приложении» — версия и дата сборки, а режим дебага подскажет, что услышала модель, если проверка не удалась.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },

    // --- Шаг 2: темы оформления ---
    {
      scene: { title: 'Шаг 2', text: 'Выберем тему оформления.' },
      pause: 3400,
      say: 'Теперь про оформление: тему каждый выбирает под себя.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Тема',
      pause: 5800,
      say: 'В приложении шесть тем: светлые, тёмные и цветные.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Светлая',
      pause: 4200,
      say: 'Светлая — для дневного времени.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Терракота',
      pause: 4300,
      say: 'Терракота — тёплые бежевые оттенки.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Аметист',
      pause: 4900,
      say: 'Аметист — тёмная тема с фиолетовыми акцентами.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Тёмная',
      pause: 4900,
      say: 'Вернёмся к тёмной — это тема по умолчанию.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { back: true },

    // --- Шаг 3: раздел «Данные» ---
    {
      scene: { title: 'Шаг 3', text: 'Подробнее про раздел «Данные».' },
      pause: 3400,
      say: 'Отдельно остановимся на разделе «Данные» — он отвечает за сохранность курсов.',
      voice: NARRATOR,
      sayDelay: 700,
    },
    {
      tap: 'Данные',
      pause: 5400,
      say: 'Здесь три действия: экспорт, импорт и сброс.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Экспортировать',
      pause: 7500,
      say: 'Экспорт сохраняет выбранные уроки в файл — например, чтобы перенести их на другое устройство.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Давайте познакомимся',
      pause: 6900,
      say: 'Отметим уроки, которые войдут в файл: оставим только «Новые соседи».',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Экспортировать',
      pause: 5300,
      say: 'Нажимаем «Экспортировать» — приложение сохранит файл.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Файл можно отправить себе на почту или сохранить в облаке.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 5700,
    },
    {
      tap: 'Импортировать',
      pause: 5400,
      say: 'Импорт — обратное действие: выбираем файл с копией данных.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    { eval: IMPORT_FILE_STEP },
    {
      say: 'Приложение прочитает файл и покажет, что внутри: курсы, уроки, задания и карточки.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 8400,
    },
    {
      say: '«Слияние» добавит уроки из файла к текущим, «Замена» полностью заменит все данные приложения.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 8600,
    },
    {
      tap: 'Отмена',
      pause: 6000,
      say: 'Отменим импорт — эти уроки уже есть в приложении.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      tap: 'Сбросить данные',
      pause: 8300,
      say: 'Сброс возвращает приложение к начальному состоянию — например, если хотите начать всё заново.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Курсы, уроки и настройки удаляются без возможности восстановления, поэтому приложение просит подтверждение.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 8700,
    },
    {
      tap: 'Отмена',
      pause: 4600,
      say: 'Отменим — данные нам ещё пригодятся.',
      voice: NARRATOR,
      sayDelay: 600,
    },
    {
      say: 'Теперь вы знаете, где настроить приложение под себя и как сохранить курсы в файл.',
      voice: NARRATOR,
      sayDelay: 300,
      wait: 6900,
    },
  ],
};
