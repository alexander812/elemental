/**
 * Движок туториал-скринкастов Lexi (скил `new-video`).
 *
 * Запуск из корня репозитория (нужен dev-сервер приложения, по умолчанию http://localhost:5173):
 *   npm run dev
 *   node skills/new-video/engine/runner.cjs skills/new-video/scenarios/<id>.cjs
 *
 * Затем публикация (mp4 + webm + постер в app/public/videos):
 *   node skills/new-video/engine/audio.cjs <name> --trim=auto --webm --poster=0.6 \
 *     --to=app/public/videos
 *
 * Каталог результатов: $TUT_OUT, по умолчанию $TMPDIR/opencode/tutorial-out.
 * Адрес приложения: $TUT_BASE (по умолчанию http://localhost:5173/).
 * Браузер: $TUT_CHROMIUM, иначе свежий Chromium из кеша ms-playwright.
 *
 * Сценарий (обычный CommonJS-модуль): { name, seed, steps }
 * seed — данные localStorage в формате моделей приложения (без конверта).
 * steps — массив шагов, ключи шага:
 *   caption          — подпись-плашка снизу (можно без действия)
 *   captionMs        — сколько держать подпись, мс (по умолчанию 2200)
 *   scene            — карточка сцены: { title: 'Сцена 1', text: 'Для начала загрузим курс.' },
 *                      текст печатается по буквам; заканчивается затемнением и паузой
 *   sceneTypeMs      — скорость печати, мс на букву (45)
 *   sceneHoldMs      — пауза после напечатанного текста (1500)
 *   hint             — тултип у элемента действия с текстом-подсказкой (до и после действия)
 *   hintMs           — сколько держать тултип до действия (1400)
 *   hintAfterMs      — сколько держать тултип после действия (700)
 *   tap              — текст/название элемента (кнопка, radio, текст)
 *   tapAt            — { x, y } — тап по координатам
 *   type             — { target: 'Название поля', text: '...', delay?: 90 }
 *   swipe            — { target: 'Monday', dir: 'left'|'right'|'up'|'down', distance?: 220 }
 *   back             — true: тап по стрелке «назад» в шапке
 *   wait             — пауза, мс
 *   pause            — пауза после действия, мс (по умолчанию на действие)
 *   speech           — что «услышит» распознавание при тапе по микрофону
 *   speechError      — ошибка распознавания (no-speech, network, …)
 *   speechDelay      — через сколько мс вернётся результат
 *   say / sayLang    — реплика для звуковой дорожки (macOS say), см. audio.cjs
 *   sayDelay/sayRate — задержка и темп реплики
 *   voice            — голос say вручную
 *   eval             — произвольный код в контексте страницы
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(SKILL_ROOT, '..', '..');

function requireFrom(candidates, name) {
  const tried = [];

  for (const dir of candidates) {
    try {
      return require(require.resolve(name, { paths: [dir] }));
    } catch {
      tried.push(dir);
    }
  }

  throw new Error(
    `Не найден пакет «${name}». Поставь его (npm i ${name}) в один из каталогов: ${tried.join(', ')}`
  );
}

const DEPS_DIRS = [
  REPO_ROOT,
  path.join(os.tmpdir(), 'opencode', 'e2e'),
  __dirname,
];

const { chromium } = requireFrom(DEPS_DIRS, 'playwright-core');

function findChromium() {
  if (process.env.TUT_CHROMIUM) return process.env.TUT_CHROMIUM;

  const cacheDir = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const binary = 'chrome-mac/Chromium.app/Contents/MacOS/Chromium';

  if (fs.existsSync(cacheDir)) {
    const candidates = fs
      .readdirSync(cacheDir)
      .filter((entry) => entry.startsWith('chromium-'))
      .sort()
      .reverse()
      .map((entry) => path.join(cacheDir, entry, binary))
      .filter((file) => fs.existsSync(file));

    if (candidates.length) return candidates[0];
  }

  throw new Error('Не нашёл Chromium из кеша ms-playwright. Укажи путь в $TUT_CHROMIUM');
}

function readDataVersion() {
  try {
    const source = fs.readFileSync(path.join(REPO_ROOT, 'app/src/lib/storage.ts'), 'utf8');
    const match = source.match(/DATA_VERSION = (\d+)/);
    if (match) return Number(match[1]);
  } catch {
    /* остаётся значение по умолчанию */
  }

  return 7;
}

const EXECUTABLE = findChromium();
const OUT_DIR = process.env.TUT_OUT || path.join(os.tmpdir(), 'opencode', 'tutorial-out');
const BASE = process.env.TUT_BASE || 'http://localhost:5173/';
const DATA_VERSION = readDataVersion();

const scenarioPath = process.argv[2] || 'scenarios/add-ready-course.cjs';
const scenario = require(
  fs.existsSync(path.resolve(process.cwd(), scenarioPath))
    ? path.resolve(process.cwd(), scenarioPath)
    : path.resolve(SKILL_ROOT, scenarioPath)
);

const CURSOR_TRAVEL = 480;
const PRESS = 90;
const PAUSE = { tap: 750, type: 600, swipe: 900, back: 700 };

const envelope = (data) => ({ version: DATA_VERSION, data });

function seedScript(entries) {
  for (const [key, value] of entries) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function presentationScript(cursorTravel) {
  const install = () => {
    if (document.getElementById('__tut')) return;

    const host = document.createElement('div');
    host.id = '__tut';
    host.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden;' +
      "font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;";

    const fade = document.createElement('div');
    fade.style.cssText =
      'position:absolute;inset:0;background:#050505;opacity:1;transition:opacity .45s ease;';
    host.appendChild(fade);

    const cursor = document.createElement('div');
    cursor.style.cssText =
      'position:absolute;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;' +
      'border-radius:50%;background:rgba(255,255,255,.95);' +
      'box-shadow:0 0 0 2px rgba(0,0,0,.28),0 8px 20px rgba(0,0,0,.38);' +
      `transition:transform ${cursorTravel}ms cubic-bezier(.33,1,.68,1),opacity .3s ease;` +
      'transform:translate(-60px,120px) scale(.9);opacity:0;';
    host.appendChild(cursor);

    const caption = document.createElement('div');
    caption.style.cssText =
      'position:absolute;left:50%;bottom:104px;transform:translate(-50%,14px);max-width:82%;' +
      'padding:11px 18px;border-radius:999px;background:rgba(10,10,12,.86);color:#fff;' +
      'font-size:14px;font-weight:500;line-height:1.35;text-align:center;white-space:pre-wrap;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.45);opacity:0;transition:opacity .28s ease,transform .28s ease;';
    host.appendChild(caption);

    const style = document.createElement('style');
    style.textContent = '@keyframes __tutBlink { 50% { opacity: 0 } }';
    host.appendChild(style);

    const scene = document.createElement('div');
    scene.style.cssText =
      'position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;gap:18px;' +
      'padding:0 34px;background:rgba(5,5,5,.9);opacity:0;transition:opacity .4s ease;';
    const sceneTitle = document.createElement('div');
    sceneTitle.style.cssText =
      'font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55);';
    const sceneText = document.createElement('div');
    sceneText.style.cssText =
      'font-size:26px;font-weight:600;line-height:1.3;color:#fff;white-space:pre-wrap;';
    const caret = document.createElement('span');
    caret.style.cssText =
      'display:inline-block;width:2px;height:26px;margin-left:2px;vertical-align:-4px;' +
      'background:rgba(255,255,255,.8);animation:__tutBlink .8s step-end infinite;';
    scene.append(sceneTitle, sceneText);
    host.appendChild(scene);

    const hintRing = document.createElement('div');
    hintRing.style.cssText =
      'position:absolute;display:none;border:2px solid rgba(255,255,255,.85);border-radius:14px;' +
      'box-shadow:0 0 0 5px rgba(255,255,255,.12);opacity:0;transition:opacity .2s ease;';
    host.appendChild(hintRing);

    const hint = document.createElement('div');
    hint.style.cssText =
      'position:absolute;display:none;max-width:250px;padding:10px 14px;border-radius:12px;' +
      'background:rgba(10,10,12,.94);color:#fff;font-size:13px;font-weight:500;line-height:1.35;' +
      'text-align:center;box-shadow:0 12px 30px rgba(0,0,0,.5);opacity:0;transition:opacity .2s ease;';
    host.appendChild(hint);

    document.body.appendChild(host);
    window.__tutReadyAt = Date.now();
    requestAnimationFrame(() => {
      fade.style.opacity = '0';
    });
    setTimeout(() => fade.remove(), 700);

    let hideTimer = 0;
    let hintHideTimer = 0;

    window.__tut = {
      moveTo(x, y) {
        cursor.style.opacity = '1';
        cursor.style.transform = `translate(${x}px,${y}px) scale(1)`;
      },
      press(x, y) {
        cursor.style.transform = `translate(${x}px,${y}px) scale(.72)`;
        const ripple = document.createElement('div');
        ripple.style.cssText =
          'position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;' +
          'border-radius:50%;border:2px solid rgba(255,255,255,.9);background:rgba(255,255,255,.22);' +
          'transform:translate(' + x + 'px,' + y + 'px) scale(.4);opacity:.75;' +
          'transition:transform .55s cubic-bezier(.2,.7,.3,1),opacity .55s ease;';
        host.appendChild(ripple);
        requestAnimationFrame(() => {
          ripple.style.transform = `translate(${x}px,${y}px) scale(4.6)`;
          ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 650);
      },
      release(x, y) {
        cursor.style.transform = `translate(${x}px,${y}px) scale(1)`;
      },
      caption(text, ms) {
        clearTimeout(hideTimer);
        caption.textContent = text;
        caption.style.opacity = '1';
        caption.style.transform = 'translate(-50%,0)';
        hideTimer = setTimeout(() => {
          caption.style.opacity = '0';
          caption.style.transform = 'translate(-50%,14px)';
        }, ms);
      },
      captionHide() {
        clearTimeout(hideTimer);
        caption.style.opacity = '0';
        caption.style.transform = 'translate(-50%,14px)';
      },
      scene(title, text, options) {
        const { typeMs = 45, holdMs = 1500 } = options ?? {};

        return new Promise((resolve) => {
          cursor.style.opacity = '0';
          sceneTitle.textContent = title;
          sceneText.textContent = '';
          sceneText.appendChild(caret);
          scene.style.display = 'flex';
          requestAnimationFrame(() => {
            scene.style.opacity = '1';
          });

          let index = 0;
          const timer = setInterval(() => {
            index += 1;
            sceneText.textContent = text.slice(0, index);
            sceneText.appendChild(caret);

            if (index >= text.length) {
              clearInterval(timer);
              caret.remove();
              setTimeout(() => {
                scene.style.opacity = '0';
                setTimeout(() => {
                  scene.style.display = 'none';
                  resolve();
                }, 420);
              }, holdMs);
            }
          }, typeMs);
        });
      },
      hintShow(text, rect) {
        const gap = 12;
        const above = rect ? rect.y > 130 : false;

        clearTimeout(hintHideTimer);
        hint.textContent = text;
        hint.style.display = 'block';

        if (rect) {
          const centerX = Math.min(Math.max(rect.x + rect.width / 2, 130), window.innerWidth - 130);

          hint.style.left = `${centerX}px`;
          hint.style.bottom = 'auto';
          hint.style.top = above ? `${rect.y - gap}px` : `${rect.y + rect.height + gap}px`;
          hint.style.transform = above ? 'translate(-50%,-100%)' : 'translate(-50%,0)';

          hintRing.style.display = 'block';
          hintRing.style.left = `${rect.x - 5}px`;
          hintRing.style.top = `${rect.y - 5}px`;
          hintRing.style.width = `${rect.width + 10}px`;
          hintRing.style.height = `${rect.height + 10}px`;
        } else {
          hint.style.left = '50%';
          hint.style.top = '120px';
          hint.style.bottom = 'auto';
          hint.style.transform = 'translate(-50%,0)';
          hintRing.style.display = 'none';
        }

        requestAnimationFrame(() => {
          hint.style.opacity = '1';
          if (rect) hintRing.style.opacity = '1';
        });
      },
      hintHide() {
        clearTimeout(hintHideTimer);
        hint.style.opacity = '0';
        hintRing.style.opacity = '0';
        hintHideTimer = setTimeout(() => {
          hint.style.display = 'none';
          hintRing.style.display = 'none';
        }, 250);
      },
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
}

function mockSpeechScript() {
  window.__speech = { delay: 80, error: null, transcript: '' };
  class MockRecognition {
    constructor() {
      this.lang = '';
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
    }
    start() {
      setTimeout(() => {
        if (window.__speech.error) {
          if (this.onerror) this.onerror({ error: window.__speech.error });
          if (this.onend) this.onend();
          return;
        }
        const alternative = { confidence: 0.92, transcript: window.__speech.transcript };
        const result = [alternative];
        result.length = 1;
        const results = [result];
        results.length = 1;
        if (this.onresult) this.onresult({ results });
        if (this.onend) this.onend();
      }, window.__speech.delay ?? 80);
    }
    abort() {}
    stop() {}
  }
  window.SpeechRecognition = MockRecognition;
}

async function find(page, query, timeout = 8000) {
  const deadline = Date.now() + timeout;

  for (;;) {
    const variants = [
      () => page.getByRole('button', { name: query, exact: true }),
      () => page.getByRole('button', { name: query }),
      () => page.getByRole('radio', { name: query, exact: true }),
      () => page.getByText(query, { exact: true }),
      () => page.getByText(query),
    ];

    for (const make of variants) {
      const loc = make().filter({ visible: true }).first();
      if (await loc.count()) {
        try {
          await loc.scrollIntoViewIfNeeded({ timeout: 1000 });
        } catch {
          /* элемент уже виден */
        }
        return loc;
      }
    }

    if (Date.now() > deadline) {
      const body = (await page.textContent('body')).replace(/\s+/g, ' ').slice(0, 300);
      throw new Error(`Не нашёл элемент: «${query}». Сейчас на экране: ${body}`);
    }
    await page.waitForTimeout(120);
  }
}

async function tapPoint(page, x, y, pause, hideHint = false) {
  await page.evaluate(({ x, y }) => window.__tut.moveTo(x, y), { x, y });
  await page.mouse.move(x, y);
  await page.waitForTimeout(CURSOR_TRAVEL);
  await page.evaluate(({ x, y }) => window.__tut.press(x, y), { x, y });
  await page.mouse.down();
  await page.waitForTimeout(PRESS);
  await page.mouse.up();
  await page.evaluate(({ x, y }) => window.__tut.release(x, y), { x, y });
  if (hideHint) await page.evaluate(() => window.__tut.hintHide());
  await page.waitForTimeout(pause ?? PAUSE.tap);
}

async function tap(page, query, pause, hideHint) {
  const loc = await find(page, query);
  const box = await loc.boundingBox();
  if (!box) throw new Error(`Элемент вне видимой области: «${query}»`);
  await tapPoint(page, box.x + box.width / 2, box.y + box.height / 2, pause, hideHint);
}

async function tapBack(page, pause, hideHint) {
  const point = await page.evaluate(() => {
    const rects = [...document.querySelectorAll('button')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.top < 90 && r.left < 70 && r.width > 0 && r.height > 0 && r.width <= 64);
    if (!rects.length) return null;
    const r = rects[0];
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!point) throw new Error('Кнопка «назад» не найдена');
  await tapPoint(page, point.x, point.y, pause, hideHint);
}

async function findInput(page, target) {
  const deadline = Date.now() + 8000;
  for (;;) {
    const byLabel = page.getByLabel(target, { exact: true }).first();
    if (await byLabel.count()) return byLabel;

    const byPlaceholder = page.getByPlaceholder(target, { exact: true }).first();
    if (await byPlaceholder.count()) return byPlaceholder;

    const handle = await page.evaluateHandle((text) => {
      const nodes = [...document.querySelectorAll('p,span,label,div')].filter(
        (el) => el.childElementCount === 0 && el.textContent.trim() === text
      );
      for (const node of nodes) {
        const scopes = [node.closest('label'), node.parentElement, node.parentElement?.parentElement, node.parentElement?.parentElement?.parentElement];
        for (const scope of scopes) {
          const field = scope?.querySelector('input,textarea');
          if (field) return field;
        }
      }
      return null;
    }, target);
    const field = handle.asElement();
    if (field) return field;

    if (Date.now() > deadline) throw new Error(`Не нашёл поле: «${target}»`);
    await page.waitForTimeout(120);
  }
}

async function typeInto(page, step) {
  const delay = step.delay ?? 90;
  const field = await findInput(page, step.target);
  const box = await field.boundingBox();
  if (!box) throw new Error(`Поле вне видимой области: «${step.target}»`);
  await tapPoint(page, box.x + box.width / 2, Math.min(box.y + box.height / 2, box.y + 28), 250);
  await field.pressSequentially(step.text, { delay });
}

async function swipe(page, step, hideHint = false) {
  const distance = step.distance ?? 220;
  const dir = step.dir ?? 'left';
  const loc = await find(page, step.target);
  const box = await loc.boundingBox();
  if (!box) throw new Error(`Элемент вне видимой области: «${step.target}»`);

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const dx = dir === 'left' ? -distance : dir === 'right' ? distance : 0;
  const dy = dir === 'up' ? -distance : dir === 'down' ? distance : 0;

  await page.evaluate(({ x, y }) => window.__tut.moveTo(x, y), { x: cx, y: cy });
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(CURSOR_TRAVEL);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 12 });
  await page.mouse.up();
  await page.evaluate(({ x, y }) => window.__tut.moveTo(x, y), { x: cx + dx, y: cy + dy });
  if (hideHint) await page.evaluate(() => window.__tut.hintHide());
  await page.waitForTimeout(step.pause ?? PAUSE.swipe);
}

async function runStep(page, step) {
  if (step.scene) {
    await page.evaluate(
      ({ scene, typeMs, holdMs }) =>
        window.__tut.scene(scene.title ?? '', scene.text ?? '', {
          typeMs,
          holdMs,
        }),
      {
        scene: step.scene,
        typeMs: step.sceneTypeMs ?? 45,
        holdMs: step.sceneHoldMs ?? 1500,
      }
    );
    await page.waitForTimeout(step.pause ?? 400);
    return;
  }

  if (step.caption) {
    await page.evaluate(
      ({ text, ms }) => window.__tut.caption(text, ms),
      { text: step.caption, ms: step.captionMs ?? 2200 }
    );
  }

  if (step.hint) {
    const target = step.tap ?? step.swipe?.target ?? step.type?.target ?? null;
    let rect = null;

    if (target) {
      const loc = await find(page, target);
      rect = await loc.boundingBox();
    }

    await page.evaluate(
      ({ text, rect }) => window.__tut.hintShow(text, rect),
      { text: step.hint, rect }
    );

    if (process.env.TUT_DEBUG_HINT) {
      await page.waitForTimeout(250);
      const state = await page.evaluate(() => {
        const host = document.getElementById('__tut');
        const tooltip = host.lastElementChild;
        return {
          opacity: getComputedStyle(tooltip).opacity,
          display: getComputedStyle(tooltip).display,
          rect: tooltip.getBoundingClientRect().toJSON(),
        };
      });
      console.log('  debug hint:', JSON.stringify({ text: step.hint, target: rect, tooltip: state }));
    }

    await page.waitForTimeout(step.hintMs ?? 1400);
  }

  if (step.speech !== undefined || step.speechError !== undefined || step.speechDelay !== undefined) {
    await page.evaluate(
      ({ transcript, error, delay }) => {
        if (transcript !== undefined) window.__speech.transcript = transcript;
        if (error !== undefined) window.__speech.error = error;
        else if (transcript !== undefined) window.__speech.error = null;
        if (delay !== undefined) window.__speech.delay = delay;
      },
      {
        transcript: step.speech,
        error: step.speechError,
        delay: step.speechDelay,
      }
    );
  }

  const withHint = step.hint !== undefined;

  if (step.wait) {
    await page.waitForTimeout(step.wait);
  } else if (step.tap) {
    await tap(page, step.tap, step.pause, withHint);
  } else if (step.tapAt) {
    await tapPoint(page, step.tapAt.x, step.tapAt.y, step.pause, withHint);
  } else if (step.type) {
    await typeInto(page, step.type);
    if (withHint) await page.evaluate(() => window.__tut.hintHide());
    await page.waitForTimeout(step.pause ?? PAUSE.type);
  } else if (step.swipe) {
    await swipe(page, step.swipe, withHint);
  } else if (step.back) {
    await tapBack(page, step.pause ?? PAUSE.back, withHint);
  } else if (step.eval) {
    const result = await page.evaluate(step.eval);
    if (result !== undefined) console.log('  debug eval →', JSON.stringify(result).slice(0, 400));
  } else if (withHint) {
    await page.waitForTimeout(step.pause ?? 1200);
  }

  if (withHint) {
    await page.waitForTimeout(step.hintAfterMs ?? 0);
    await page.evaluate(() => window.__tut.hintHide());
  }
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: EXECUTABLE,
    headless: true,
    args: ['--force-device-scale-factor=2'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: path.join(OUT_DIR, '.tmp'), size: { width: 780, height: 1688 } },
  });

  await context.addInitScript(presentationScript, CURSOR_TRAVEL);
  await context.addInitScript(mockSpeechScript);
  await context.addInitScript(
    seedScript,
    [
      ...Object.entries(scenario.seed).map(([key, data]) => [`app.${key}`, envelope(data)]),
      ['app.seeded', envelope(true)],
    ]
  );

  const page = await context.newPage();
  const videoT0 = Date.now();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const readyAt = await page.evaluate(() => window.__tutReadyAt ?? null);

  const steps = scenario.steps ?? [];
  const timeline = [];
  const startedAt = Date.now();
  let index = 0;
  for (const step of steps) {
    index += 1;
    const label =
      step.scene
        ? `scene «${step.scene.title}»`
        : (step.caption ??
          (step.tap ? `tap «${step.tap}»` : step.type ? `type «${step.type.target}»` : step.swipe ? `swipe «${step.swipe.target}»` : step.back ? 'back' : step.wait ? `wait ${step.wait}` : step.tapAt ? 'tapAt' : step.hint ? `hint «${step.hint}»` : 'eval'));
    process.stdout.write(`[${index}/${steps.length}] ${label}\n`);
    timeline.push({
      index,
      label,
      atMs: Date.now() - startedAt,
      say: step.say ?? null,
      sayLang: step.sayLang ?? null,
      voice: step.voice ?? null,
      sayDelay: step.sayDelay ?? null,
      sayRate: step.sayRate ?? null,
    });
    await runStep(page, step);
  }

  const startedFromFirstFrame = Date.now() - startedAt;
  timeline.push({ index: steps.length + 1, label: 'конец сценария', atMs: startedFromFirstFrame, say: null });
  fs.writeFileSync(
    path.join(OUT_DIR, `${scenario.name ?? 'tutorial'}.timeline.json`),
    JSON.stringify(
      {
        name: scenario.name,
        leadMs: startedAt - videoT0,
        readyMs: readyAt ? readyAt - videoT0 : null,
        steps: timeline,
      },
      null,
      2
    )
  );

  await page.waitForTimeout(1400);
  await context.close();

  const outFile = path.join(OUT_DIR, `${scenario.name ?? 'tutorial'}.webm`);
  await page.video().saveAs(outFile);
  await browser.close();

  fs.rmSync(path.join(OUT_DIR, '.tmp'), { recursive: true, force: true });

  console.log(`\nВидео: ${outFile}`);
  console.log(`Таймлайн: ${path.join(OUT_DIR, `${scenario.name ?? 'tutorial'}.timeline.json`)}`);
  if (errors.length) console.log(`Ошибки страницы (${errors.length}):\n${errors.slice(0, 5).join('\n')}`);
  else console.log('Ошибок страницы нет');
})().catch((error) => {
  console.error('SCRIPT ERROR', error);
  process.exit(1);
});
