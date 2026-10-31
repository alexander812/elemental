import type { PoliglotCourseData, PoliglotQuestionPage } from './lesson-one'

export type PoliglotExerciseCategory = {
  id: string
  name: string
  cards: { original: string; translation: string }[]
  pages: PoliglotQuestionPage[]
}

type ExerciseVerb = {
  base: string
  thirdPerson: string
  past: string
  meaning: string
  ending: string
  presentRu: string
  presentNegativeRu?: string
  pastRu: string
  futureRu: string
  cardPhrase?: string
  cardTranslation?: string
}

type ExerciseCategory = {
  id: string
  name: string
  verbs: ExerciseVerb[]
}

const buildQuestion = (
  verb: ExerciseVerb,
  categoryIndex: number,
  verbIndex: number
): PoliglotQuestionPage => {
  const form = (categoryIndex * 15 + verbIndex) % 9
  const subject = verb.base === 'cost' ? 'It' : 'She'
  const subjectRu = verb.base === 'cost' ? 'Это' : verb.base === 'like' ? 'Ей' : 'Она'
  const lowerSubject = subject.toLowerCase()
  const negativeEnding = verb.ending.replace(/^some\b/, 'any').split(' ')
  const questionEnding = [...negativeEnding]
  questionEnding[questionEnding.length - 1] += '?'
  const endings = verb.ending.split(' ')
  const definitions = [
    {
      tense: 'будущее',
      form: 'вопрос',
      phrase: verb.futureRu,
      answer: ['Will', lowerSubject, verb.base, ...questionEnding],
      extra: ['Did', verb.past, verb.thirdPerson],
    },
    {
      tense: 'будущее',
      form: 'утверждение',
      phrase: verb.futureRu,
      answer: [subject, 'will', verb.base, ...endings],
      extra: [verb.past, verb.thirdPerson, 'did'],
    },
    {
      tense: 'будущее',
      form: 'отрицание',
      phrase: `не ${verb.futureRu}`,
      answer: [subject, 'will', 'not', verb.base, ...negativeEnding],
      extra: [verb.past, verb.thirdPerson, 'did'],
    },
    {
      tense: 'настоящее',
      form: 'вопрос',
      phrase: verb.presentRu,
      answer: ['Does', lowerSubject, verb.base, ...questionEnding],
      extra: ['Do', verb.past, verb.thirdPerson],
    },
    {
      tense: 'настоящее',
      form: 'утверждение',
      phrase: verb.presentRu,
      answer: [subject, verb.thirdPerson, ...endings],
      extra: [verb.base, verb.past, 'will'],
    },
    {
      tense: 'настоящее',
      form: 'отрицание',
      phrase: verb.presentNegativeRu ?? `не ${verb.presentRu}`,
      answer: [subject, 'doesn’t', verb.base, ...negativeEnding],
      extra: ['don’t', verb.thirdPerson, verb.past],
    },
    {
      tense: 'прошлое',
      form: 'вопрос',
      phrase: verb.pastRu,
      answer: ['Did', lowerSubject, verb.base, ...questionEnding],
      extra: ['Do', verb.past, verb.thirdPerson],
    },
    {
      tense: 'прошлое',
      form: 'утверждение',
      phrase: verb.pastRu,
      answer: [subject, verb.past, ...endings],
      extra: [verb.base, verb.thirdPerson, 'will'],
    },
    {
      tense: 'прошлое',
      form: 'отрицание',
      phrase: `не ${verb.pastRu}`,
      answer: [subject, 'didn’t', verb.base, ...negativeEnding],
      extra: ['don’t', verb.past, verb.thirdPerson],
    },
  ]
  const selected = definitions[form]
  const words = [...new Set([...selected.answer, ...selected.extra])]
  const offset = ((categoryIndex + verbIndex) % (words.length - 1)) + 1
  const question = selected.form === 'вопрос' ? '?' : ''
  return {
    kind: 'question',
    title: `Тест ${verbIndex + 1} из 15`,
    prompt: `${subjectRu} ${selected.phrase}${question}`,
    answer: selected.answer,
    bank: [...words.slice(offset), ...words.slice(0, offset)],
    hint: `${verb.cardPhrase ?? verb.base} — ${verb.cardTranslation ?? verb.meaning} · ${selected.tense} · ${selected.form}`,
  }
}

export const parseExercises = (data: PoliglotCourseData['exercises']): PoliglotExerciseCategory[] =>
  (data.categories as ExerciseCategory[]).map((category, categoryIndex) => ({
    id: category.id,
    name: category.name,
    cards: category.verbs.map((verb) => ({
      original: verb.cardTranslation ?? verb.meaning,
      translation: verb.cardPhrase ?? verb.base,
    })),
    pages: category.verbs.map((verb, verbIndex) => buildQuestion(verb, categoryIndex, verbIndex)),
  }))
