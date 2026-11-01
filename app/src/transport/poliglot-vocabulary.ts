import type { PoliglotVocabularyPage } from '../courses/poliglot/lesson-one'
import type { CatalogCourseData } from './catalog'

const files = import.meta.glob<string>('../courses/poliglot/course_poliglot_vocabulary.*.json', {
  query: '?url',
  import: 'default',
  eager: true,
})

let pending: Promise<[CatalogCourseData, CatalogCourseData]> | undefined

async function fetchVocabulary(lang: string): Promise<CatalogCourseData> {
  const url = files[`../courses/poliglot/course_poliglot_vocabulary.${lang}.json`]
  if (!url) throw new Error('poliglot_vocabulary_not_found')
  const response = await fetch(url)
  if (!response.ok) throw new Error('poliglot_vocabulary_download_failed')
  const data = (await response.json()) as CatalogCourseData
  if (!Array.isArray(data.lessons)) throw new Error('poliglot_vocabulary_invalid')
  return data
}

export async function fetchPoliglotVocabulary(
  lessonIndex: number,
  taskCount: number
): Promise<PoliglotVocabularyPage[]> {
  pending ??= Promise.all([fetchVocabulary('ru'), fetchVocabulary('en')]).catch((error) => {
    pending = undefined
    throw error
  })
  const [original, translation] = await pending
  const userTasks = original.lessons[lessonIndex]?.tasks
  const tasks = translation.lessons[lessonIndex]?.tasks
  if (!tasks || !userTasks || tasks.length !== taskCount || userTasks.length !== taskCount)
    throw new Error('poliglot_vocabulary_invalid')
  return tasks.map((task, index) => {
    const userTask = userTasks[index]
    if (!task.words.length || task.words.length !== userTask.words.length)
      throw new Error('poliglot_vocabulary_invalid')
    return {
      kind: 'vocabulary',
      title: userTask.name,
      texts: { ru: userTask.text, en: task.text },
      words: task.words.map((word, wordIndex) => {
        const original = userTask.words[wordIndex].trim()
        const translation = word.trim()
        if (!original || !translation) throw new Error('poliglot_vocabulary_invalid')
        return { original, translation }
      }),
    }
  })
}
