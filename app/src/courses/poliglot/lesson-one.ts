import courseData from './course_poliglot.en.json'

export type PoliglotTable = {
  headers: string[]
  rows: string[][]
}

export type PoliglotTheoryPage = {
  kind: 'theory'
  title: string
  paragraphs?: string[]
  examples?: string[]
  table?: PoliglotTable
}

export type PoliglotQuestionPage = {
  kind: 'question'
  title: string
  prompt: string
  answer: string[]
  bank: string[]
  hint?: string
}

export type PoliglotPage = PoliglotTheoryPage | PoliglotQuestionPage

export type PoliglotTask = {
  id: string
  name: string
  pages: PoliglotPage[]
}

export const POLIGLOT_LESSON_NAME = courseData.lessonOne.name

type LessonVerb = {
  base: string
  thirdPerson: string
  past: string
  meaning: string
  subject: string
  subjectRu: string
  thirdPersonSubject: boolean
  presentRu: string
  pastRu: string
  futureRu: string
}

const LESSON_VERBS: LessonVerb[] = courseData.lessonOne.verbs

const buildMatrixQuestions = (): PoliglotQuestionPage[] => {
  const total = LESSON_VERBS.length
  return LESSON_VERBS.map<PoliglotQuestionPage>((verb, verbIndex) => {
    const subject = verb.subject === 'I' ? 'I' : verb.subject.toLowerCase()
    const helper = verb.thirdPersonSubject ? 'Does' : 'Do'
    const negative = verb.thirdPersonSubject ? 'doesn’t' : 'don’t'
    const present = verb.thirdPersonSubject ? verb.thirdPerson : verb.base
    const definitions = [
      {
        tense: 'будущее',
        form: 'вопрос',
        prompt: `${verb.subjectRu} ${verb.futureRu}?`,
        answer: ['Will', subject, `${verb.base}?`],
        extra: ['Did', `${verb.past}?`, `${verb.thirdPerson}?`],
      },
      {
        tense: 'будущее',
        form: 'утверждение',
        prompt: `${verb.subjectRu} ${verb.futureRu}`,
        answer: [verb.subject, 'will', verb.base],
        extra: [verb.past, verb.thirdPerson, 'did'],
      },
      {
        tense: 'будущее',
        form: 'отрицание',
        prompt: `${verb.subjectRu} не ${verb.futureRu}`,
        answer: [verb.subject, 'will', 'not', verb.base],
        extra: [verb.past, verb.thirdPerson, 'did'],
      },
      {
        tense: 'настоящее',
        form: 'вопрос',
        prompt: `${verb.subjectRu} ${verb.presentRu}?`,
        answer: [helper, subject, `${verb.base}?`],
        extra: [helper === 'Do' ? 'Does' : 'Do', `${verb.past}?`, `${verb.thirdPerson}?`],
      },
      {
        tense: 'настоящее',
        form: 'утверждение',
        prompt: `${verb.subjectRu} ${verb.presentRu}`,
        answer: [verb.subject, present],
        extra: [verb.thirdPersonSubject ? verb.base : verb.thirdPerson, verb.past, 'will'],
      },
      {
        tense: 'настоящее',
        form: 'отрицание',
        prompt: `${verb.subjectRu} не ${verb.presentRu}`,
        answer: [verb.subject, negative, verb.base],
        extra: [verb.thirdPersonSubject ? 'don’t' : 'doesn’t', verb.thirdPerson, verb.past],
      },
      {
        tense: 'прошлое',
        form: 'вопрос',
        prompt: `${verb.subjectRu} ${verb.pastRu}?`,
        answer: ['Did', subject, `${verb.base}?`],
        extra: ['Do', `${verb.past}?`, `${verb.thirdPerson}?`],
      },
      {
        tense: 'прошлое',
        form: 'утверждение',
        prompt: `${verb.subjectRu} ${verb.pastRu}`,
        answer: [verb.subject, verb.past],
        extra: [verb.base, verb.thirdPerson, 'will'],
      },
      {
        tense: 'прошлое',
        form: 'отрицание',
        prompt: `${verb.subjectRu} не ${verb.pastRu}`,
        answer: [verb.subject, 'didn’t', verb.base],
        extra: ['don’t', verb.past, verb.thirdPerson],
      },
    ]
    const definition = definitions[verbIndex]
    const words = [...new Set([...definition.answer, ...definition.extra])]
    const offset = (verbIndex % (words.length - 1)) + 1
    return {
      kind: 'question',
      title: `Тест ${verbIndex + 1} из ${total}`,
      prompt: definition.prompt,
      answer: definition.answer,
      bank: [...words.slice(offset), ...words.slice(0, offset)],
      hint: `${verb.base} — ${verb.meaning} · ${definition.tense} · ${definition.form}`,
    }
  })
}

export const POLIGLOT_LESSON_ONE: PoliglotTask[] = courseData.lessonOne.tasks.map((task) => ({
  id: task.id,
  name: task.name,
  pages: [
    ...task.pages.map((page): PoliglotPage => {
      if (page.kind === 'theory') return { ...page, kind: 'theory' }
      if (
        page.kind === 'question' &&
        'prompt' in page &&
        'answer' in page &&
        'bank' in page &&
        page.prompt !== undefined &&
        page.answer !== undefined &&
        page.bank !== undefined
      ) {
        return {
          ...page,
          kind: 'question',
          prompt: page.prompt,
          answer: page.answer,
          bank: page.bank,
        }
      }
      throw new Error('poliglot_invalid_page')
    }),
    ...(task.matrixQuestions ? buildMatrixQuestions() : []),
  ],
}))
