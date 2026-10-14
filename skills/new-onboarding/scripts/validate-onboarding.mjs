#!/usr/bin/env node
// Валидатор онбординга Lexi.
// Запуск: node skills/new-onboarding/scripts/validate-onboarding.mjs [feature]
//         ONBOARDING_KEY=<ключ localStorage без префикса app.> — по умолчанию имя фичи
// Примеры:
//   node skills/new-onboarding/scripts/validate-onboarding.mjs                  # канон features/onboarding
//   ONBOARDING_KEY=cards-intro node skills/new-onboarding/scripts/validate-onboarding.mjs cards-intro

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const feature = process.argv[2] ?? 'onboarding'
const key = process.env.ONBOARDING_KEY ?? feature

const root = process.env.ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const errors = []
const warnings = []

const readFile = (file) => {
  const full = path.isAbsolute(file) ? file : path.join(root, file)

  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null
}

const listFiles = (dir, suffix) => {
  const full = path.join(root, dir)

  if (!fs.existsSync(full)) return null

  return fs
    .readdirSync(full)
    .filter((name) => name.endsWith(suffix))
    .map((name) => `${dir}/${name}`)
}

const featureDir = `app/src/features/${feature}`
const storeFile = `${featureDir}/store/index.ts`
const store = readFile(storeFile)
const uiFiles = listFiles(`${featureDir}/ui`, '.tsx')
const pcssFiles = listFiles(`${featureDir}/ui`, '.pcss') ?? []

if (store === null) {
  errors.push(`${storeFile}: файл не найден`)
} else {
  if (!store.includes("from '../../../lib/storage'")) {
    errors.push(`${storeFile}: нет load/save из lib/storage`)
  }

  if (!store.includes(`'${key}'`)) {
    errors.push(`${storeFile}: нет ключа localStorage '${key}'`)
  }

  if (!store.includes('completed')) {
    errors.push(`${storeFile}: нет флага completed`)
  }

  if (!/\bload\s*</.test(store) || !/\bsave\s*\(/.test(store)) {
    errors.push(`${storeFile}: состояние не читается/не сохраняется через load/save`)
  }
}

if (!uiFiles || uiFiles.length === 0) {
  errors.push(`${featureDir}/ui: нет ни одного .tsx`)
}

const layout = readFile('app/src/layouts/AppLayout.tsx')

if (layout === null) {
  errors.push('app/src/layouts/AppLayout.tsx: файл не найден')
} else {
  if (!layout.includes(`features/${feature}/`)) {
    errors.push('AppLayout: онбординг не импортируется из AppLayout')
  }

  if (!layout.includes('$appReady')) {
    errors.push('AppLayout: рендер не привязан к $appReady (печать уйдёт под splash)')
  }
}

const overlays = pcssFiles
  .map((file) => ({ file, source: readFile(file) ?? '' }))
  .filter(({ source }) => /position:\s*absolute/.test(source) && /inset:\s*0/.test(source))

if (overlays.length === 0) {
  errors.push(`${featureDir}/ui: нет pcss с «position: absolute; inset: 0» (полноэкранный оверлей)`)
}

for (const { file, source } of overlays) {
  const zIndexes = [...source.matchAll(/z-index:\s*(\d+)/g)].map((match) => Number(match[1]))

  for (const value of zIndexes) {
    if (value >= 1000) {
      errors.push(`${file}: z-index ${value} ≥ 1000 — перекроет портал bottom sheet`)
    }
  }
}

const pcssText = pcssFiles.map((file) => readFile(file) ?? '').join('\n')

if (pcssFiles.length > 0 && !pcssText.includes('prefers-reduced-motion')) {
  warnings.push(`${featureDir}/ui: нет prefers-reduced-motion — анимации не отключаются`)
}

if (store && store.includes('hints')) {
  const shakeHooks = [
    'app/src/features/onboarding/ui/useShakeHint.ts',
    'app/src/features/onboarding/ui/useDelayedShake.ts',
  ]

  if (!shakeHooks.some((file) => readFile(file) !== null)) {
    warnings.push('нет общих shake-хуков (features/onboarding/ui) — подсказки без анимации')
  }
}

const runner = readFile('skills/new-video/engine/runner.cjs')

if (runner === null) {
  warnings.push('skills/new-video/engine/runner.cjs: файл не найден')
} else if (key === 'onboarding' && !runner.includes("'app.onboarding'")) {
  warnings.push('runner.cjs: нет сида app.onboarding — видео снимутся с онбордингом')
}

const project = readFile('PROJECT.md')

if (project === null) {
  warnings.push('PROJECT.md: файл не найден')
} else if (!project.includes(key) && !project.includes('Онбординг')) {
  warnings.push('PROJECT.md: нет упоминания онбординга')
}

for (const warning of warnings) console.warn('⚠', warning)
for (const error of errors) console.error('✕', error)

if (errors.length) {
  console.error(`✕ ${feature}: ошибок ${errors.length}, предупреждений ${warnings.length}`)
  process.exit(1)
}

console.log(`✓ ${feature}: всё в порядке (предупреждений ${warnings.length})`)
