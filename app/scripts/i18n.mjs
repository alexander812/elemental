#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const repoDir = path.resolve(appDir, '..')
const srcDir = path.join(appDir, 'src')
const messagesDir = path.join(srcDir, 'lib', 'i18n', 'messages')

const FALLBACK_LOCALE = 'en'
const snapshotFile = path.join(messagesDir, `${FALLBACK_LOCALE}.json`)

const args = process.argv.slice(2)
const localeIndex = args.indexOf('--locale')
const localeArg = localeIndex >= 0 ? args[localeIndex + 1] : null
const asJson = args.includes('--json')
const check = args.includes('--check')
const stale = args.includes('--stale')
const writeEn = args.includes('--write-en')

const listFiles = (dir, result = []) => {
  if (!fs.existsSync(dir)) return result

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      listFiles(full, result)
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      result.push(full)
    }
  }

  return result
}

const parseString = (node) => {
  if (!node) return null
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text

  return null
}

const parseJsxString = (node) => {
  if (!node) return null
  if (ts.isJsxExpression(node)) return parseString(node.expression)

  return parseString(node)
}

const messages = new Map()
const problems = []

const siteOf = (sourceFile, node) => {
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1

  return `${path.relative(repoDir, sourceFile.fileName)}:${line}`
}

const addMessage = (id, defaultMessage, site) => {
  const existing = messages.get(id)

  if (!existing) {
    messages.set(id, { id, defaultMessage, sites: [site] })
    return
  }

  if (existing.defaultMessage !== defaultMessage) {
    problems.push({
      kind: 'conflict',
      message: `id "${id}" используется с разными defaultMessage: "${existing.defaultMessage}" (${existing.sites[0]}) и "${defaultMessage}" (${site})`,
    })
    return
  }

  existing.sites.push(site)
}

const formattedMessageNames = (sourceFile) => {
  const names = new Set()

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    if (statement.moduleSpecifier.text !== 'react-intl') continue

    const bindings = statement.importClause?.namedBindings

    if (!bindings || !ts.isNamedImports(bindings)) continue

    for (const element of bindings.elements) {
      if ((element.propertyName ?? element.name).text === 'FormattedMessage') {
        names.add(element.name.text)
      }
    }
  }

  return names
}

const visit = (node, sourceFile, formattedNames) => {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node
    const tag = opening.tagName
    const tagName = ts.isIdentifier(tag) ? tag.text : null

    if (tagName && formattedNames.has(tagName)) {
      let id = null
      let defaultMessage = null
      let idNode = null

      for (const attribute of opening.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue
        if (!ts.isIdentifier(attribute.name)) continue

        if (attribute.name.text === 'id') {
          id = parseJsxString(attribute.initializer)
          idNode = attribute.initializer ?? attribute
        }

        if (attribute.name.text === 'defaultMessage') {
          defaultMessage = parseJsxString(attribute.initializer)
        }
      }

      if (idNode && id === null) {
        problems.push({
          kind: 'non_literal',
          message: `<${tagName}> с не-строковым id или без него: ${siteOf(sourceFile, idNode)}`,
        })
      } else if (id !== null && defaultMessage === null) {
        problems.push({
          kind: 'missing_default',
          message: `id "${id}" без defaultMessage: ${siteOf(sourceFile, opening)}`,
        })
      } else if (id !== null && defaultMessage !== null) {
        addMessage(id, defaultMessage, siteOf(sourceFile, opening))
      }
    }
  }

  if (ts.isObjectLiteralExpression(node)) {
    const props = new Map()

    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue
      if (!ts.isIdentifier(property.name)) continue
      if (property.name.text !== 'id' && property.name.text !== 'defaultMessage') continue

      const value = parseString(property.initializer)

      props.set(property.name.text, value)
    }

    if (props.has('id') && props.has('defaultMessage')) {
      const id = props.get('id')
      const defaultMessage = props.get('defaultMessage')

      if (id === null || defaultMessage === null) {
        problems.push({
          kind: 'non_literal',
          message: `дескриптор с не-строковым id/defaultMessage: ${siteOf(sourceFile, node)}`,
        })
      } else {
        addMessage(id, defaultMessage, siteOf(sourceFile, node))
      }
    }
  }

  ts.forEachChild(node, (child) => visit(child, sourceFile, formattedNames))
}

for (const file of listFiles(srcDir)) {
  const content = fs.readFileSync(file, 'utf8')
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, kind)

  visit(sourceFile, sourceFile, formattedMessageNames(sourceFile))
}

const localeData = new Map()

let snapshotData = null

if (fs.existsSync(messagesDir)) {
  for (const file of fs.readdirSync(messagesDir)) {
    if (!file.endsWith('.json')) continue

    const code = file.replace('.json', '')
    const isSnapshot = code === FALLBACK_LOCALE
    const full = path.join(messagesDir, file)

    let parsed

    try {
      parsed = JSON.parse(fs.readFileSync(full, 'utf8'))
    } catch (error) {
      problems.push({
        kind: 'bad_json',
        message: `не удалось разобрать ${path.relative(repoDir, full)}: ${error.message}`,
      })
      continue
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      problems.push({
        kind: 'bad_json',
        message: `${path.relative(repoDir, full)} должен быть объектом { id: "перевод" }`,
      })
      continue
    }

    const entries = new Map()

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'string') {
        problems.push({
          kind: 'bad_value',
          message: `${path.relative(repoDir, full)}: "${key}" — значение должно быть строкой`,
        })
        continue
      }

      if (value.trim() === '') {
        problems.push({
          kind: 'empty_value',
          message: `${path.relative(repoDir, full)}: "${key}" — пустой перевод`,
        })
        continue
      }

      entries.set(key, value)
    }

    if (isSnapshot) {
      snapshotData = { file: path.relative(repoDir, full), entries }
    } else {
      localeData.set(code, { code, file: path.relative(repoDir, full), entries })
    }
  }
}

const icuArgs = (text) => {
  const result = new Set()
  let index = 0

  while (index < text.length) {
    const char = text[index]

    if (char === "'") {
      index += 1
      while (index < text.length && text[index] !== "'") index += 1
      index += 1
      continue
    }

    if (char !== '{') {
      index += 1
      continue
    }

    let cursor = index + 1
    let name = ''

    while (cursor < text.length && !/[,}\s]/.test(text[cursor])) {
      name += text[cursor]
      cursor += 1
    }

    if (/^[a-zA-Z0-9_]+$/.test(name)) result.add(name)

    let depth = 1

    while (cursor < text.length && depth > 0) {
      if (text[cursor] === '{') depth += 1
      else if (text[cursor] === '}') depth -= 1
      cursor += 1
    }

    index = cursor
  }

  return result
}

const compareArgs = (id, defaultMessage, translation, file) => {
  const expected = icuArgs(defaultMessage)
  const actual = icuArgs(translation)
  const missing = [...expected].filter((name) => !actual.has(name))
  const extra = [...actual].filter((name) => !expected.has(name))

  if (missing.length === 0 && extra.length === 0) return

  const details = [
    missing.length > 0 ? `нет: ${missing.join(', ')}` : null,
    extra.length > 0 ? `лишние: ${extra.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('; ')

  problems.push({
    kind: 'placeholder_mismatch',
    message: `${file}: "${id}" — переменные не совпадают с defaultMessage (${details})`,
  })
}

const codeIds = [...messages.keys()].sort()

const drift = { changed: [], added: [], removed: [] }

if (snapshotData) {
  for (const id of codeIds) {
    const current = messages.get(id).defaultMessage
    const previous = snapshotData.entries.get(id)

    if (previous === undefined) drift.added.push(id)
    else if (previous !== current) drift.changed.push({ id, from: previous, to: current })
  }

  for (const id of snapshotData.entries.keys()) {
    if (!messages.has(id)) drift.removed.push(id)
  }
} else {
  drift.added = [...codeIds]
}

const driftCount = drift.changed.length + drift.added.length + drift.removed.length

const localesWith = (id) =>
  [...localeData.values()]
    .filter((locale) => locale.entries.has(id))
    .map((locale) => locale.code)
    .sort()

if (writeEn) {
  const conflicts = problems.filter((problem) => problem.kind === 'conflict')

  if (conflicts.length > 0) {
    console.log('id с разными defaultMessage — снимок не обновлён:')

    for (const problem of conflicts) console.log(`- ${problem.message}`)

    process.exit(1)
  }

  const snapshot = Object.fromEntries(codeIds.map((id) => [id, messages.get(id).defaultMessage]))

  fs.writeFileSync(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`)

  console.log(`Снимок обновлён: ${path.relative(repoDir, snapshotFile)} (${codeIds.length} ключей)`)
  process.exit(0)
}

for (const { code, file, entries } of localeData.values()) {
  for (const key of entries.keys()) {
    if (!messages.has(key)) {
      problems.push({
        kind: 'extra',
        message: `${file}: "${key}" — ключа нет в коде`,
      })
    }
  }

  for (const key of codeIds) {
    if (!entries.has(key)) continue

    compareArgs(key, messages.get(key).defaultMessage, entries.get(key), file)
  }
}

const buildLocaleInfo = ({ code, file, entries }) => {
  const missing = codeIds.filter((id) => !entries.has(id))
  const extra = [...entries.keys()].filter((id) => !messages.has(id)).sort()

  return {
    code,
    file,
    total: codeIds.length,
    translated: codeIds.length - missing.length,
    missing: missing.map((id) => ({
      id,
      defaultMessage: messages.get(id).defaultMessage,
      sites: messages.get(id).sites,
    })),
    extra,
  }
}

const locales = [...localeData.values()]
  .map(buildLocaleInfo)
  .sort((a, b) => a.code.localeCompare(b.code))

const exitCode = check && (problems.length > 0 || driftCount > 0) ? 1 : 0

const snapshotInfo = {
  present: Boolean(snapshotData),
  file: snapshotData?.file ?? path.relative(repoDir, snapshotFile),
  changed: drift.changed.map(({ id, from, to }) => ({ id, from, to, locales: localesWith(id) })),
  added: drift.added.map((id) => ({
    id,
    defaultMessage: messages.get(id).defaultMessage,
    locales: localesWith(id),
  })),
  removed: drift.removed.map((id) => ({ id, locales: localesWith(id) })),
}

if (asJson) {
  if (localeArg) {
    const locale = locales.find((item) => item.code === localeArg) ?? {
      code: localeArg,
      file: null,
      total: codeIds.length,
      translated: 0,
      missing: codeIds.map((id) => ({
        id,
        defaultMessage: messages.get(id).defaultMessage,
        sites: messages.get(id).sites,
      })),
      extra: [],
    }

    console.log(
      JSON.stringify({ total: codeIds.length, locale, snapshot: snapshotInfo, problems }, null, 2)
    )
  } else {
    console.log(
      JSON.stringify(
        { total: codeIds.length, codeIds, snapshot: snapshotInfo, locales, problems },
        null,
        2
      )
    )
  }

  process.exit(exitCode)
}

if (stale) {
  if (!snapshotData) {
    console.log(
      `Снимок ${path.relative(repoDir, snapshotFile)} отсутствует — создай: npm run i18n -- --write-en`
    )
    process.exit(exitCode)
  }

  console.log(`Снимок: ${snapshotData.file}`)

  if (driftCount === 0) {
    console.log('Английские тексты не менялись — переводы актуальны.')
    process.exit(exitCode)
  }

  if (drift.changed.length > 0) {
    console.log(`\nИзменённые тексты (${drift.changed.length}) — переводы проверить и обновить:`)

    for (const { id, from, to } of drift.changed) {
      const locales = localesWith(id)

      console.log(
        `${id}\n  было: "${from}"\n  стало: "${to}"\n  переводы: ${locales.length > 0 ? locales.join(', ') : 'нет'}`
      )
    }
  }

  if (drift.added.length > 0) {
    console.log(`\nНовые ключи (${drift.added.length}):`)

    for (const id of drift.added) {
      const locales = localesWith(id)

      console.log(
        `${id} — ${messages.get(id).defaultMessage} (переводы: ${locales.length > 0 ? locales.join(', ') : 'нет'})`
      )
    }
  }

  if (drift.removed.length > 0) {
    console.log(`\nУдалённые ключи (${drift.removed.length}) — переводы лишние:`)

    for (const id of drift.removed) {
      const locales = localesWith(id)

      console.log(`${id} (есть в: ${locales.length > 0 ? locales.join(', ') : '—'})`)
    }
  }

  console.log('\nПроверь и обнови переводы, затем прими новые тексты: npm run i18n -- --write-en')

  process.exit(exitCode)
}

if (localeArg) {
  if (localeArg === FALLBACK_LOCALE) {
    if (!snapshotData) {
      console.log(
        `Снимок ${path.relative(repoDir, snapshotFile)} отсутствует — создай: npm run i18n -- --write-en`
      )
    } else if (driftCount === 0) {
      console.log(
        `Английский: снимок ${snapshotData.file} совпадает с defaultMessage (${codeIds.length}/${codeIds.length}).`
      )
    } else {
      console.log(
        `Английский: расхождений ${driftCount} (изменено ${drift.changed.length}, новых ${drift.added.length}, удалено ${drift.removed.length}) — подробности: npm run i18n -- --stale`
      )
    }

    process.exit(exitCode)
  }

  const locale = locales.find((item) => item.code === localeArg)

  if (!locale) {
    console.log(
      `Локаль "${localeArg}": файла ${path.join('app/src/lib/i18n/messages', `${localeArg}.json`)} нет — не переведено всё (${codeIds.length}).\n`
    )
    for (const id of codeIds) {
      const message = messages.get(id)
      console.log(`${id} — ${message.defaultMessage}`)
    }
  } else if (locale.missing.length === 0) {
    console.log(`Локаль "${locale.code}": всё переведено (${locale.total}/${locale.total}).`)
  } else {
    console.log(
      `Локаль "${locale.code}": не переведено ${locale.missing.length} из ${locale.total} (${locale.file})\n`
    )

    for (const { id, defaultMessage, sites } of locale.missing) {
      console.log(`${id} — ${defaultMessage} (${sites.join(', ')})`)
    }
  }

  if (locale && locale.extra.length > 0) {
    console.log(`\nЛишние ключи (${locale.extra.length}): ${locale.extra.join(', ')}`)
  }

  if (driftCount > 0) {
    console.log(
      `\nДрейф английских текстов: изменено ${drift.changed.length}, новых ${drift.added.length}, удалено ${drift.removed.length} — подробности: npm run i18n -- --stale`
    )
  }

  if (problems.length > 0) {
    console.log('\nПроблемы:')

    for (const problem of problems) console.log(`- ${problem.message}`)
  }

  process.exit(exitCode)
}

console.log(`Ключей в коде: ${codeIds.length}`)
console.log('Английский — defaultMessage в коде')

if (!snapshotData) {
  console.log(
    `Снимок ${path.relative(repoDir, snapshotFile)}: отсутствует (создать: npm run i18n -- --write-en)`
  )
} else if (driftCount === 0) {
  console.log(`Снимок ${snapshotData.file}: совпадает`)
} else {
  console.log(
    `Снимок ${snapshotData.file}: изменено ${drift.changed.length}, новых ${drift.added.length}, удалено ${drift.removed.length} (подробности: npm run i18n -- --stale; принять: npm run i18n -- --write-en)`
  )
}

for (const locale of locales) {
  const missing = locale.missing.length > 0 ? `, не переведено ${locale.missing.length}` : ''

  console.log(`${locale.code}: ${locale.translated}/${locale.total}${missing} (${locale.file})`)
}

if (locales.length === 0) {
  console.log('Файлов локалей нет: app/src/lib/i18n/messages/*.json')
}

if (problems.length > 0) {
  console.log(`\nПроблемы (${problems.length}):`)

  for (const problem of problems) console.log(`- ${problem.message}`)
} else {
  console.log('\nСтруктурные проблемы: нет')
}

process.exit(exitCode)
