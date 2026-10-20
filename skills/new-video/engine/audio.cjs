/**
 * Постобработка скринкастов (скил `new-video`): сборка mp4 из webm, звук из реплик `say`,
 * обрезка старта, постер и раскладка готовых файлов в приложение.
 *
 * Запуск из корня репозитория:
 *   node skills/new-video/engine/audio.cjs <name> --trim=auto --poster=0.6 --to=app/public/videos/<locale>
 *
 * Опции:
 *   --trim=<сек|auto>   обрезать начало (auto — до первого кадра приложения из timeline.readyMs)
 *   --poster=<сек>      сделать кадр-постер <name>.jpg на этой секунде итогового видео
 *   --to=<каталог>      скопировать <name>.mp4/.jpg в каталог (например app/public/videos/ru)
 *   --webm              дополнительно собрать <name>.webm (VP9) — не используется в приложении
 *   --offset=<мс>       сдвиг всех реплик
 *   --voice-ru=, --voice-en=, --voice-es=, --voice-fr=
 *
 * Голос шага (`voice` в сценарии): имя голоса `say` либо `edge:<голос>` — нейросетевой
 * голос edge-tts (нужен `python3 -m pip install --user edge-tts`, например
 * `edge:ru-RU-DmitryNeural`). `sayRate` для edge пересчитывается в проценты скорости.
 *
 * Каталог результатов — тот же $TUT_OUT, что у runner.cjs (по умолчанию $TMPDIR/opencode/tutorial-out).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SKILL_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(SKILL_ROOT, '..', '..');

function requireFrom(candidates, name) {
  for (const dir of candidates) {
    try {
      return require(require.resolve(name, { paths: [dir] }));
    } catch {
      /* пробуем следующий каталог */
    }
  }

  throw new Error(`Не найден пакет «${name}». Поставь его: npm i ${name}`);
}

const DEPS_DIRS = [REPO_ROOT, path.join(os.tmpdir(), 'opencode', 'e2e'), __dirname];

const FFMPEG = requireFrom(DEPS_DIRS, 'ffmpeg-static');

const OUT_DIR = process.env.TUT_OUT || path.join(os.tmpdir(), 'opencode', 'tutorial-out');

const argv = process.argv.slice(2);
const name = argv.find((arg) => !arg.startsWith('--')) ?? 'lexi-demo';
const opt = (key, fallback) => {
  const found = argv.find((arg) => arg.startsWith(`--${key}=`));
  return found ? found.split('=')[1] : fallback;
};

const OFFSET_MS = Number(opt('offset', 0));
const VOICES = {
  ru: opt('voice-ru', 'Milena'),
  en: opt('voice-en', 'Samantha'),
  es: opt('voice-es', 'Monica'),
  fr: opt('voice-fr', 'Thomas'),
};

const timelinePath = path.join(OUT_DIR, `${name}.timeline.json`);
const timeline = fs.existsSync(timelinePath)
  ? JSON.parse(fs.readFileSync(timelinePath, 'utf8'))
  : null;

const video = path.join(OUT_DIR, `${name}.webm`);
const out = path.join(OUT_DIR, `${name}.mp4`);
const poster = path.join(OUT_DIR, `${name}.jpg`);
const webmOut = path.join(OUT_DIR, `${name}.fallback.webm`);
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lexi-audio-'));

const trimOption = opt('trim', '0');
const TRIM_MS =
  trimOption === 'auto'
    ? Math.round((timeline?.readyMs ?? 0) + 550)
    : Math.round(Number(trimOption) * 1000);

function sayClip(text, voice, rate, file) {
  const args = [
    ...(voice ? ['-v', voice] : []),
    ...(rate ? ['-r', String(rate)] : []),
    '-o',
    file,
    text,
  ];
  try {
    execFileSync('say', args, { stdio: 'ignore' });
  } catch {
    execFileSync('say', ['-o', file, text], { stdio: 'ignore' });
  }
}

const EDGE_PREFIX = 'edge:';
const EDGE_ATTEMPTS = 4;

const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Нейросетевой голос edge-tts (например, edge:ru-RU-DmitryNeural).
// Нужен python3 и пакет: python3 -m pip install --user edge-tts
// Сервис иногда отвечает «No audio was received» — пробуем несколько раз.
function edgeClip(text, voice, rate, file) {
  const args = ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', file];

  if (rate) {
    const percent = Math.round((rate / 175 - 1) * 100);
    args.push('--rate', `${percent > 0 ? '+' : ''}${percent}%`);
  }

  for (let attempt = 1; attempt <= EDGE_ATTEMPTS; attempt += 1) {
    try {
      execFileSync('python3', args, { stdio: 'ignore' });

      if (fs.existsSync(file) && fs.statSync(file).size > 0) return;
    } catch {
      /* пробуем ещё раз */
    }

    if (attempt < EDGE_ATTEMPTS) sleepMs(2500);
  }

  throw new Error(
    `Не удалось озвучить «${text}» голосом ${voice}. Поставь edge-tts: python3 -m pip install --user edge-tts`
  );
}

function voiceClip(text, voice, rate, file) {
  if (voice && voice.startsWith(EDGE_PREFIX)) {
    edgeClip(text, voice.slice(EDGE_PREFIX.length), rate, file);
    return;
  }

  sayClip(text, voice, rate, file);
}

const clips = [];

for (const step of (timeline?.steps ?? [])) {
  if (!step.say) continue;

  const voice = step.voice ?? VOICES[step.sayLang] ?? null;
  const edge = voice?.startsWith(EDGE_PREFIX) ?? false;
  const file = path.join(workDir, `voice-${step.index}.${edge ? 'mp3' : 'aiff'}`);
  voiceClip(step.say, voice, step.sayRate, file);

  const atMs = timeline.leadMs + step.atMs + (step.sayDelay ?? 600) + OFFSET_MS - TRIM_MS;
  clips.push({ file, atMs: Math.max(0, atMs), text: step.say });

  console.log(
    `+${(atMs / 1000).toFixed(1)}с  ${voice ?? 'default'}: «${step.say}» (шаг ${step.index})`
  );
}

const inputs = clips.flatMap((clip) => ['-i', clip.file]);
const audioArgs = [];

const filter = clips.length
  ? (() => {
      const filters = clips.map(
        (clip, i) => `[${i + 1}:a]adelay=${Math.round(clip.atMs)}|${Math.round(clip.atMs)}[a${i}]`
      );
      const mixInputs = clips.map((_, i) => `[a${i}]`).join('');

      return `${filters.join(';')};${mixInputs}amix=inputs=${clips.length}:normalize=0,aresample=48000,alimiter=limit=0.95[aout]`;
    })()
  : null;

if (filter) {
  audioArgs.push(
    '-filter_complex',
    filter,
    '-map',
    '0:v',
    '-map',
    '[aout]',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-ar',
    '48000'
  );
} else {
  audioArgs.push('-map', '0:v', '-an');
}

execFileSync(
  FFMPEG,
  [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    ...(TRIM_MS ? ['-ss', String(TRIM_MS / 1000)] : []),
    '-i',
    video,
    ...inputs,
    ...audioArgs,
    '-c:v',
    'libx264',
    '-crf',
    '22',
    '-preset',
    'medium',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    out,
  ],
  { stdio: 'inherit' }
);

const posterOption = opt('poster', null);

if (posterOption) {
  execFileSync(
    FFMPEG,
    ['-y', '-hide_banner', '-loglevel', 'error', '-ss', posterOption, '-i', out, '-frames:v', '1', '-q:v', '3', poster],
    { stdio: 'inherit' }
  );
}

const webmOption = argv.includes('--webm');

if (webmOption) {
  const webmAudioArgs = filter
    ? [
        '-filter_complex',
        filter,
        '-map',
        '0:v',
        '-map',
        '[aout]',
        '-c:a',
        'libopus',
        '-b:a',
        '96k',
      ]
    : ['-map', '0:v', '-an'];

  execFileSync(
    FFMPEG,
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      ...(TRIM_MS ? ['-ss', String(TRIM_MS / 1000)] : []),
      '-i',
      video,
      ...inputs,
      ...webmAudioArgs,
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '0',
      '-crf',
      '36',
      '-row-mt',
      '1',
      '-cpu-used',
      '4',
      webmOut,
    ],
    { stdio: 'inherit' }
  );
}

fs.rmSync(workDir, { recursive: true, force: true });

const to = opt('to', null);

if (to) {
  const target = path.resolve(process.cwd(), to);
  fs.mkdirSync(target, { recursive: true });
  fs.copyFileSync(out, path.join(target, `${name}.mp4`));
  console.log(`Скопировано: ${path.join(target, `${name}.mp4`)}`);

  if (posterOption) {
    fs.copyFileSync(poster, path.join(target, `${name}.jpg`));
    console.log(`Скопировано: ${path.join(target, `${name}.jpg`)}`);
  }

  if (webmOption) {
    fs.copyFileSync(webmOut, path.join(target, `${name}.webm`));
    console.log(`Скопировано: ${path.join(target, `${name}.webm`)}`);
  }
}

console.log(`\nГотово: ${out}${TRIM_MS ? ` (обрезано ${(TRIM_MS / 1000).toFixed(1)}с)` : ''}`);
