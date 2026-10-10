#!/usr/bin/env node
// Валидатор тем Lexi.
// Запуск: node skills/new-theme/scripts/validate-theme.mjs terracotta
//         node skills/new-theme/scripts/validate-theme.mjs --all
//         TOKENS_FILE=... node ... (по умолчанию design-system/ui-kit/src/tokens/colors.json)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REFERENCE = 'dark'
const RGBA_RE = /^rgba?\((\d{1,3}), (\d{1,3}), (\d{1,3})(?:, (0|1|0?\.\d+))?\)$/
const CHANNELS_RE = /^\d{1,3}, \d{1,3}, \d{1,3}$/

const root = process.env.ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const tokensFile =
  process.env.TOKENS_FILE ?? path.join(root, 'design-system/ui-kit/src/tokens/colors.json')

const FILES = {
  uiKitThemeName: 'design-system/ui-kit/src/ThemeProvider/types.ts',
  tokensIndex: 'design-system/ui-kit/src/tokens/index.ts',
  appThemeName: 'app/src/lib/types.ts',
  settings: 'app/src/transport/settings.ts',
  themeView: 'app/src/features/settings/ui/ThemeView.tsx',
  storybook: 'design-system/ui-kit/.storybook/addons/theme-switcher/shared.ts',
  indexHtml: 'app/index.html',
  project: 'PROJECT.md',
}

const readFile = (file) => {
  const full = path.isAbsolute(file) ? file : path.join(root, file)

  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null
}

const toHex = (rgba) => {
  const match = typeof rgba === 'string' ? rgba.match(/^rgba?\((\d+), (\d+), (\d+)/) : null

  if (!match) return null

  return `#${[match[1], match[2], match[3]]
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}`
}

function validateTheme(key, themes) {
  const errors = []
  const warnings = []
  const theme = themes[key]
  const reference = themes[REFERENCE]

  if (!reference) {
    return { errors: [`${REFERENCE}: эталонная тема не найдена в colors.json`], warnings }
  }

  const referenceKeys = Object.keys(reference)

  for (const token of referenceKeys.filter((name) => !(name in theme))) {
    errors.push(`${key}: нет токена «${token}» (есть в «${REFERENCE}»)`)
  }
  for (const token of Object.keys(theme).filter((name) => !referenceKeys.includes(name))) {
    errors.push(`${key}: лишний токен «${token}» (нет в «${REFERENCE}»)`)
  }

  for (const [token, value] of Object.entries(theme)) {
    if (token.endsWith('-rgb')) {
      if (!CHANNELS_RE.test(value)) {
        errors.push(`${key}.${token}: «${value}» не каналы «R, G, B»`)
      }

      if (!(token.slice(0, -4) in theme)) {
        errors.push(`${key}.${token}: -rgb без базового токена`)
      }

      continue
    }

    if (!RGBA_RE.test(value)) {
      errors.push(`${key}.${token}: значение «${value}» не rgb()/rgba()`)
      continue
    }

    const twin = `${token}-rgb`

    if (!(twin in theme)) {
      errors.push(`${key}.${token}: нет двойника «${twin}»`)
      continue
    }

    const [r, g, b] = value.match(/^rgba?\((\d+), (\d+), (\d+)/).slice(1)
    const expected = `${r}, ${g}, ${b}`

    if (theme[twin] !== expected) {
      errors.push(`${key}.${twin}: «${theme[twin]}», а каналы ${token} — «${expected}»`)
    }
  }

  const sources = {
    uiKitThemeName: [`'${key}'`, errors],
    tokensIndex: [`'${key}'`, errors],
    appThemeName: [`'${key}'`, errors],
    settings: [`'${key}'`, errors],
    themeView: [`value="${key}"`, errors],
    storybook: [`value: '${key}'`, warnings],
    project: [key, warnings],
  }

  for (const [file, [needle, list]] of Object.entries(sources)) {
    const source = readFile(FILES[file])

    if (source === null) {
      list.push(`${FILES[file]}: файл не найден`)
    } else if (!source.includes(needle)) {
      list.push(`${FILES[file]}: нет «${needle}»`)
    }
  }

  if (key !== REFERENCE) {
    const source = readFile(FILES.indexHtml)
    const branch = source
      ? source.match(new RegExp(`parsed\\.data\\.theme === '${key}'\\)\\s*canvas = '(#[0-9a-fA-F]{6})'`))
      : null

    if (!source) {
      errors.push(`${FILES.indexHtml}: файл не найден`)
    } else if (!branch) {
      warnings.push(`${FILES.indexHtml}: нет boot-ветки для «${key}» (мигнёт тёмный фон)`)
    } else {
      const canvasHex = toHex(theme['surface-canvas'])

      if (canvasHex && branch[1].toLowerCase() !== canvasHex) {
        errors.push(`${FILES.indexHtml}: canvas ${branch[1]}, а surface-canvas — ${canvasHex}`)
      }
    }
  }

  return { errors, warnings }
}

function report(key, themes) {
  const { errors, warnings } = validateTheme(key, themes)

  for (const warning of warnings) console.warn('⚠', warning)
  for (const error of errors) console.error('✕', error)

  if (errors.length) {
    console.error(`✕ ${key}: ошибок ${errors.length}, предупреждений ${warnings.length}`)
    return false
  }

  console.log(`✓ ${key}: всё в порядке (предупреждений ${warnings.length})`)
  return true
}

let themes
try {
  themes = JSON.parse(readFile(tokensFile))
} catch (err) {
  console.error(`✕ ${tokensFile} не читается: ${err.message}`)
  process.exit(1)
}

const target = process.argv[2]

if (target === '--all') {
  const keys = Object.keys(themes)
  const results = keys.map((key) => report(key, themes))

  if (results.some((ok) => !ok)) process.exit(1)
  console.log(`\nПроверено тем: ${keys.length}`)
} else if (target && target in themes) {
  process.exit(report(target, themes) ? 0 : 1)
} else {
  console.error(`Укажите тему (${Object.keys(themes).join(', ')}) или --all`)
  process.exit(2)
}
