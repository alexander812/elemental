/**
 * Замер длительностей реплик edge-tts: по одному тексту на строку stdin печатает
 * «№ | секунды | текст». Нужен, чтобы выставить паузы в сценарии (пауза = реплика + ~0,8 с).
 *
 * Запуск из корня репозитория:
 *   node skills/new-video/engine/measure-tts.cjs <<'EOF'
 *   Начнём с загрузки готового курса — создавать его самому не нужно.
 *   Открываем добавление курса.
 *   EOF
 *
 * Голос — первый аргумент (по умолчанию ru-RU-DmitryNeural).
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function requireFrom(candidates, name) {
  for (const dir of candidates) {
    try {
      return require(require.resolve(name, { paths: [dir] }));
    } catch {
      /* пробуем следующий каталог */
    }
  }

  throw new Error(`Не найден пакет «${name}». Поставь его (npm i ${name}) в один из каталогов: ${candidates.join(', ')}`);
}

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const FFMPEG = requireFrom([REPO_ROOT, path.join(os.tmpdir(), 'opencode', 'e2e'), __dirname], 'ffmpeg-static');
const VOICE = process.argv[2] ?? 'ru-RU-DmitryNeural';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-measure-'));
const input = fs.readFileSync(0, 'utf8');

let index = 0;
let failed = 0;

for (const line of input.split('\n')) {
  const text = line.trim();

  if (!text) continue;

  index += 1;

  const file = path.join(dir, `l${index}.mp3`);
  let ok = false;

  for (let attempt = 1; attempt <= 4 && !ok; attempt += 1) {
    try {
      execFileSync('python3', ['-m', 'edge_tts', '--voice', VOICE, '--text', text, '--write-media', file], {
        stdio: 'ignore',
        timeout: 40000,
      });

      ok = fs.existsSync(file) && fs.statSync(file).size > 0;
    } catch {
      ok = false;
    }

    if (!ok) {
      fs.rmSync(file, { force: true });
      execFileSync('sleep', ['2']);
    }
  }

  if (!ok) {
    failed += 1;
    console.log(`${index}|TIMEOUT|${text}`);
    continue;
  }

  let info = '';

  try {
    info = execFileSync(FFMPEG, ['-hide_banner', '-i', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (error) {
    info = String(error.stderr ?? '');
  }

  const match = info.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const seconds = match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : 0;

  console.log(`${index}|${seconds.toFixed(2)}|${text}`);
}

console.log(`\nвсего: ${index}, ошибок: ${failed}`);
