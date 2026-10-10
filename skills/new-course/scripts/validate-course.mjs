#!/usr/bin/env node
// Валидатор готовых курсов Lexi.
// Запуск: node skills/new-course/scripts/validate-course.mjs course_05_friends
//         node skills/new-course/scripts/validate-course.mjs --all
//         COURSES_DIR=app/src/courses node ... (по умолчанию app/src/courses)

import fs from 'node:fs'
import path from 'node:path'

const LANGS = ['en', 'ru', 'es', 'fr', 'it', 'zh', 'de']
const LATIN_LANGS = LANGS.filter((lang) => lang !== 'zh')
const MIN_LEN = 400
const MAX_LEN = 530
const TASKS_PER_LESSON = 5
const WORDS_PER_TASK = 10

const dir = process.env.COURSES_DIR ?? 'app/src/courses'
const target = process.argv[2]

const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))

function validateBase(base) {
  const errors = []
  const warnings = []

  let parentCourse = null
  let lessonCount = null
  const taskCounts = {}
  const wordCounts = {}

  for (const lang of LANGS) {
    const file = `${base}.${lang}.json`
    const full = path.join(dir, file)

    if (!fs.existsSync(full)) {
      errors.push(`${file}: файл не найден`)
      continue
    }

    let data
    try {
      data = read(file)
    } catch (err) {
      errors.push(`${file}: невалидный JSON — ${err.message}`)
      continue
    }

    if (data.lang !== lang) errors.push(`${file}: lang должен быть «${lang}»`)
    if (typeof data.parentCourse !== 'string' || !data.parentCourse) {
      errors.push(`${file}: нет parentCourse`)
    } else if (parentCourse === null) {
      parentCourse = data.parentCourse
    } else if (parentCourse !== data.parentCourse) {
      errors.push(`${file}: parentCourse «${data.parentCourse}» != «${parentCourse}»`)
    }

    if (!Array.isArray(data.lessons) || data.lessons.length < 3 || data.lessons.length > 5) {
      errors.push(`${file}: уроков должно быть 3–5, сейчас ${data.lessons?.length ?? 0}`)
    }
    if (lessonCount === null) lessonCount = data.lessons?.length ?? 0
    else if ((data.lessons?.length ?? 0) !== lessonCount) {
      errors.push(`${file}: уроков ${data.lessons?.length ?? 0}, в других языках — ${lessonCount}`)
    }

    taskCounts[lang] = []
    wordCounts[lang] = []

    data.lessons?.forEach((lesson, li) => {
      if (typeof lesson.name !== 'string' || !lesson.name) {
        errors.push(`${file}: урок ${li + 1} без name`)
      }
      if (!Array.isArray(lesson.tasks) || lesson.tasks.length !== TASKS_PER_LESSON) {
        errors.push(
          `${file}: в уроке ${li + 1} заданий ${lesson.tasks?.length ?? 0}, нужно ${TASKS_PER_LESSON}`
        )
      }

      taskCounts[lang][li] = lesson.tasks?.length ?? 0
      wordCounts[lang][li] = []

      lesson.tasks?.forEach((task, ti) => {
        const where = `${file}: урок ${li + 1}, задание ${ti + 1}`

        if (typeof task.name !== 'string' || !task.name) errors.push(`${where}: нет name`)

        if (typeof task.text !== 'string' || !task.text.trim()) {
          errors.push(`${where}: нет text`)
        } else if (lang === 'zh') {
          if (task.text.length < 80) warnings.push(`${where}: короткий zh-текст (${task.text.length})`)
        } else if (task.text.length < MIN_LEN || task.text.length > MAX_LEN) {
          warnings.push(`${where}: длина ${task.text.length} вне ${MIN_LEN}–${MAX_LEN}`)
        }

        if (!Array.isArray(task.words) || task.words.length !== WORDS_PER_TASK) {
          errors.push(
            `${where}: слов ${task.words?.length ?? 0}, нужно ${WORDS_PER_TASK}`
          )
        } else if (task.words.some((word) => typeof word !== 'string' || !word.trim())) {
          errors.push(`${where}: пустые слова`)
        }

        wordCounts[lang][li][ti] = task.words?.length ?? 0
      })
    })
  }

  const reference = LATIN_LANGS.find((lang) => wordCounts[lang]?.length) ?? LANGS.find((lang) => wordCounts[lang]?.length)

  if (reference) {
    for (const lang of LANGS) {
      if (lang === reference || !wordCounts[lang]?.length) continue

      wordCounts[reference].forEach((tasks, li) => {
        tasks?.forEach((count, ti) => {
          const other = wordCounts[lang]?.[li]?.[ti]
          if (other !== undefined && other !== count) {
            errors.push(
              `Слова у ${lang} (урок ${li + 1}, задание ${ti + 1}): ${other}, у ${reference}: ${count}`
            )
          }
        })
      })
    }
  }

  return { errors, warnings }
}

function catalogEntry(base) {
  let catalog
  try {
    catalog = read('courses_beginner.json')
  } catch (err) {
    return { error: `courses_beginner.json не читается: ${err.message}` }
  }

  const entry = catalog.courses?.find(
    (item) =>
      item.files && Object.values(item.files).some((file) => file.startsWith(`${base}.`))
  )

  if (!entry) return { error: `courses_beginner.json: курс «${base}» не зарегистрирован` }

  const errors = []
  for (const lang of LANGS) {
    if (entry.files?.[lang] !== `${base}.${lang}.json`) {
      errors.push(`Каталог: files.${lang} — «${entry.files?.[lang] ?? 'нет'}»`)
    }
    if (!entry.i18n?.course?.[lang]) errors.push(`Каталог: нет i18n.course.${lang}`)
    if (!entry.i18n?.description?.[lang]) errors.push(`Каталог: нет i18n.description.${lang}`)
  }

  return { errors }
}

function report(base, { checkCatalog }) {
  const { errors, warnings } = validateBase(base)

  if (checkCatalog) {
    const catalog = catalogEntry(base)
    if (catalog.error) errors.push(catalog.error)
    else errors.push(...catalog.errors)
  }

  for (const warning of warnings) console.warn('⚠', warning)
  for (const error of errors) console.error('✕', error)

  if (errors.length) {
    console.error(`✕ ${base}: ошибок ${errors.length}, предупреждений ${warnings.length}`)
    return false
  }

  console.log(`✓ ${base}: всё в порядке (предупреждений ${warnings.length})`)
  return true
}

if (target === '--all') {
  let catalog
  try {
    catalog = read('courses_beginner.json')
  } catch (err) {
    console.error(`✕ courses_beginner.json не читается: ${err.message}`)
    process.exit(1)
  }

  const bases = new Set()
  for (const entry of catalog.courses ?? []) {
    const file = entry.files?.en ?? Object.values(entry.files ?? {})[0]
    if (typeof file === 'string') bases.add(file.replace(/\.[a-z-]+\.json$/, ''))
  }

  const results = [...bases].map((base) => report(base, { checkCatalog: false }))
  if (results.some((ok) => !ok)) process.exit(1)
  console.log(`\nПроверено курсов: ${bases.size}`)
} else if (target && !/[^\w.-]/.test(target)) {
  process.exit(report(target, { checkCatalog: true }) ? 0 : 1)
} else {
  console.error('Укажите базу файлов курса (course_05_friends) или --all')
  process.exit(2)
}
