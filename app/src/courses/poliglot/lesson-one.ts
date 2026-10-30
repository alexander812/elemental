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

export const POLIGLOT_LESSON_NAME = 'Как строить простые фразы'

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

const LESSON_VERBS: LessonVerb[] = [
  {
    base: 'love',
    thirdPerson: 'loves',
    past: 'loved',
    meaning: 'любить',
    subject: 'I',
    subjectRu: 'Я',
    thirdPersonSubject: false,
    presentRu: 'люблю',
    pastRu: 'любил',
    futureRu: 'буду любить',
  },
  {
    base: 'live',
    thirdPerson: 'lives',
    past: 'lived',
    meaning: 'жить',
    subject: 'You',
    subjectRu: 'Ты',
    thirdPersonSubject: false,
    presentRu: 'живёшь',
    pastRu: 'жил',
    futureRu: 'будешь жить',
  },
  {
    base: 'work',
    thirdPerson: 'works',
    past: 'worked',
    meaning: 'работать',
    subject: 'She',
    subjectRu: 'Она',
    thirdPersonSubject: true,
    presentRu: 'работает',
    pastRu: 'работала',
    futureRu: 'будет работать',
  },
  {
    base: 'open',
    thirdPerson: 'opens',
    past: 'opened',
    meaning: 'открывать',
    subject: 'We',
    subjectRu: 'Мы',
    thirdPersonSubject: false,
    presentRu: 'открываем',
    pastRu: 'открывали',
    futureRu: 'будем открывать',
  },
  {
    base: 'close',
    thirdPerson: 'closes',
    past: 'closed',
    meaning: 'закрывать',
    subject: 'He',
    subjectRu: 'Он',
    thirdPersonSubject: true,
    presentRu: 'закрывает',
    pastRu: 'закрывал',
    futureRu: 'будет закрывать',
  },
  {
    base: 'see',
    thirdPerson: 'sees',
    past: 'saw',
    meaning: 'видеть',
    subject: 'They',
    subjectRu: 'Они',
    thirdPersonSubject: false,
    presentRu: 'видят',
    pastRu: 'видели',
    futureRu: 'увидят',
  },
  {
    base: 'come',
    thirdPerson: 'comes',
    past: 'came',
    meaning: 'приходить',
    subject: 'You',
    subjectRu: 'Ты',
    thirdPersonSubject: false,
    presentRu: 'приходишь',
    pastRu: 'приходил',
    futureRu: 'придёшь',
  },
  {
    base: 'go',
    thirdPerson: 'goes',
    past: 'went',
    meaning: 'идти',
    subject: 'She',
    subjectRu: 'Она',
    thirdPersonSubject: true,
    presentRu: 'идёт',
    pastRu: 'шла',
    futureRu: 'пойдёт',
  },
  {
    base: 'know',
    thirdPerson: 'knows',
    past: 'knew',
    meaning: 'знать',
    subject: 'I',
    subjectRu: 'Я',
    thirdPersonSubject: false,
    presentRu: 'знаю',
    pastRu: 'знал',
    futureRu: 'буду знать',
  },
]

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

export const POLIGLOT_LESSON_ONE: PoliglotTask[] = [
  {
    id: 'present-statements',
    name: 'Утверждаем в настоящем',
    pages: [
      {
        kind: 'theory',
        title: 'Одна матрица — девять форм',
        paragraphs: [
          '50–70 частотных глаголов и базовые слова помогут обсуждать большинство повседневных тем.',
          'Выбери столбец: вопрос, утверждение или отрицание. Строки сверху вниз: будущее, настоящее, прошлое. Найди пересечение и подставь глагол и местоимение.',
          'Повторяй все девять форм понемногу каждый день.',
        ],
        table: {
          headers: ['Вопрос', 'Утверждение', 'Отрицание'],
          rows: [
            ['Will I love?', 'I will love', 'I will not love'],
            ['Do I love?\nDoes she love?', 'I love\nShe loves', 'I don’t love\nShe doesn’t love'],
            ['Did I love?', 'I loved', 'I did not love'],
          ],
        },
      },
      {
        kind: 'theory',
        title: 'Кто выполняет действие?',
        paragraphs: ['Начни предложение с того, кто выполняет действие.'],
        table: {
          headers: ['Кто', 'Перевод'],
          rows: [
            ['I', 'я'],
            ['you', 'ты / вы'],
            ['we', 'мы'],
            ['they', 'они'],
            ['he', 'он'],
            ['she', 'она'],
            ['it', 'оно / это'],
          ],
        },
      },
      {
        kind: 'theory',
        title: 'Добавляем действие',
        paragraphs: [
          'После I, you, we и they используй начальную форму глагола. После he, she и it обычно добавляй -s.',
          'Эта схема — для обычных смысловых глаголов. Глагол to be изучается отдельно.',
        ],
        examples: ['We love — Мы любим', 'She loves — Она любит'],
      },
      {
        kind: 'theory',
        title: 'Схема утверждения',
        table: {
          headers: ['Кто', 'Глагол'],
          rows: [
            ['I / you / we / they', 'love'],
            ['he / she / it', 'loves'],
          ],
        },
        examples: ['He loves — Он любит'],
      },
      {
        kind: 'theory',
        title: 'Глаголы урока',
        table: {
          headers: ['Глагол', 'Перевод'],
          rows: [
            ['love', 'любить'],
            ['live', 'жить'],
            ['open', 'открывать'],
            ['close', 'закрывать'],
            ['work', 'работать'],
          ],
        },
      },
      {
        kind: 'question',
        title: 'Тест 1 из 5',
        prompt: 'Я работаю',
        answer: ['I', 'work'],
        bank: ['work', 'I', 'works', 'worked'],
      },
      {
        kind: 'question',
        title: 'Тест 2 из 5',
        prompt: 'Она любит',
        answer: ['She', 'loves'],
        bank: ['love', 'She', 'loves', 'He'],
      },
      {
        kind: 'question',
        title: 'Тест 3 из 5',
        prompt: 'Я живу',
        answer: ['I', 'live'],
        bank: ['lives', 'I', 'lived', 'live'],
      },
      {
        kind: 'question',
        title: 'Тест 4 из 5',
        prompt: 'Мы открываем',
        answer: ['We', 'open'],
        bank: ['opened', 'We', 'opens', 'open'],
      },
      {
        kind: 'question',
        title: 'Тест 5 из 5',
        prompt: 'Он закрывает',
        answer: ['He', 'closes'],
        bank: ['close', 'He', 'closed', 'closes'],
      },
    ],
  },
  {
    id: 'present-negatives-questions',
    name: 'Отрицаем и спрашиваем',
    pages: [
      {
        kind: 'theory',
        title: 'Как сказать «не»',
        paragraphs: [
          'После I, you, we и they используй don’t. После he, she и it — doesn’t.',
          'Основной глагол остаётся в начальной форме, без -s.',
        ],
        examples: ['I don’t love — Я не люблю', 'She doesn’t love — Она не любит'],
      },
      {
        kind: 'theory',
        title: 'Как задать вопрос',
        paragraphs: [
          'В общем вопросе с обычным смысловым глаголом поставь do или does перед местоимением.',
          'После does используй начальную форму глагола, без -s.',
        ],
        examples: ['Do you love? — Ты любишь?', 'Does she love? — Она любит?'],
      },
      {
        kind: 'theory',
        title: 'I / you / we / they',
        table: {
          headers: ['Форма', 'Пример'],
          rows: [
            ['Утверждение', 'You love'],
            ['Отрицание', 'You don’t love'],
            ['Вопрос', 'Do you love?'],
          ],
        },
      },
      {
        kind: 'theory',
        title: 'He / she / it',
        table: {
          headers: ['Форма', 'Пример'],
          rows: [
            ['Утверждение', 'She loves'],
            ['Отрицание', 'She doesn’t love'],
            ['Вопрос', 'Does she love?'],
          ],
        },
      },
      {
        kind: 'question',
        title: 'Тест 1 из 3',
        prompt: 'Ты работаешь?',
        answer: ['Do', 'you', 'work?'],
        bank: ['work?', 'Does', 'you', 'Do', 'worked?'],
        hint: 'work — работать',
      },
      {
        kind: 'question',
        title: 'Тест 2 из 3',
        prompt: 'Он не приходит',
        answer: ['He', 'doesn’t', 'come'],
        bank: ['come', 'He', 'doesn’t', 'comes', 'don’t'],
        hint: 'come — приходить',
      },
      {
        kind: 'question',
        title: 'Тест 3 из 3',
        prompt: 'Ты не любишь',
        answer: ['You', 'don’t', 'love'],
        bank: ['love', 'You', 'don’t', 'doesn’t', 'loves'],
      },
    ],
  },
  {
    id: 'past',
    name: 'Говорим о прошлом',
    pages: [
      {
        kind: 'theory',
        title: 'Правильные глаголы',
        paragraphs: [
          'В утвердительном предложении в прошедшем времени добавь к правильному глаголу окончание -ed.',
          'Если слово заканчивается на -e, добавь только -d.',
        ],
        table: {
          headers: ['Начальная форма', 'Прошедшее время'],
          rows: [
            ['open\nоткрывать', 'opened\nоткрыл'],
            ['love\nлюбить', 'loved\nлюбил'],
          ],
        },
      },
      {
        kind: 'theory',
        title: 'Неправильные глаголы',
        paragraphs: ['Эти формы прошлого нужно запомнить.'],
        table: {
          headers: ['Обычно', 'В прошлом', 'Перевод'],
          rows: [
            ['see', 'saw', 'видеть'],
            ['come', 'came', 'приходить'],
            ['go', 'went', 'идти'],
            ['know', 'knew', 'знать'],
          ],
        },
      },
      {
        kind: 'theory',
        title: 'Отрицание в прошлом',
        paragraphs: [
          'Используй didn’t + начальную форму глагола. Правило одинаково для всех лиц.',
          'После didn’t — see, а не saw.',
        ],
        examples: ['She didn’t see — Она не видела'],
      },
      {
        kind: 'theory',
        title: 'Вопрос в прошлом',
        paragraphs: [
          'В общем вопросе с обычным смысловым глаголом используй did + местоимение + начальную форму.',
        ],
        examples: ['Did he go? — Он пошёл?'],
      },
      {
        kind: 'theory',
        title: 'Схема прошлого',
        table: {
          headers: ['Форма', 'Пример'],
          rows: [
            ['Утверждение', 'He went'],
            ['Отрицание', 'He didn’t go'],
            ['Вопрос', 'Did he go?'],
          ],
        },
      },
      {
        kind: 'question',
        title: 'Тест 1 из 8',
        prompt: 'Она закрыла',
        answer: ['She', 'closed'],
        bank: ['close', 'He', 'closed', 'She', 'closes'],
      },
      {
        kind: 'question',
        title: 'Тест 2 из 8',
        prompt: 'Ты не пошёл',
        answer: ['You', 'didn’t', 'go'],
        bank: ['went', 'You', 'go', 'didn’t', 'don’t'],
      },
      {
        kind: 'question',
        title: 'Тест 3 из 8',
        prompt: 'Он пошёл',
        answer: ['He', 'went'],
        bank: ['go', 'He', 'goes', 'went', 'She'],
      },
      {
        kind: 'question',
        title: 'Тест 4 из 8',
        prompt: 'Мы открыли',
        answer: ['We', 'opened'],
        bank: ['open', 'We', 'opened', 'opens'],
      },
      {
        kind: 'question',
        title: 'Тест 5 из 8',
        prompt: 'Она любила',
        answer: ['She', 'loved'],
        bank: ['love', 'She', 'loved', 'loves'],
      },
      {
        kind: 'question',
        title: 'Тест 6 из 8',
        prompt: 'Они не видели',
        answer: ['They', 'didn’t', 'see'],
        bank: ['saw', 'They', 'see', 'didn’t', 'don’t'],
      },
      {
        kind: 'question',
        title: 'Тест 7 из 8',
        prompt: 'Ты пришёл?',
        answer: ['Did', 'you', 'come?'],
        bank: ['came?', 'you', 'Did', 'come?', 'comes?'],
      },
      {
        kind: 'question',
        title: 'Тест 8 из 8',
        prompt: 'Я знал',
        answer: ['I', 'knew'],
        bank: ['know', 'I', 'knew', 'knows'],
      },
    ],
  },
  {
    id: 'future',
    name: 'Говорим о будущем',
    pages: [
      {
        kind: 'theory',
        title: 'Утверждение в будущем',
        paragraphs: [
          'Поставь will перед начальной формой глагола. Правило одинаково для всех лиц.',
        ],
        examples: ['I will love — Я буду любить', 'He will love — Он будет любить'],
      },
      {
        kind: 'theory',
        title: 'Отрицание в будущем',
        paragraphs: [
          'Используй will not + начальную форму глагола.',
          'Will not можно сократить до won’t.',
        ],
        examples: ['She will not love — Она не будет любить'],
      },
      {
        kind: 'theory',
        title: 'Вопрос в будущем',
        paragraphs: ['В общем вопросе поставь will в начало, перед местоимением.'],
        examples: ['Will he love? — Он полюбит?'],
      },
      {
        kind: 'theory',
        title: 'Схема будущего',
        table: {
          headers: ['Форма', 'Пример'],
          rows: [
            ['Утверждение', 'You will go'],
            ['Отрицание', 'You will not go'],
            ['Вопрос', 'Will you go?'],
          ],
        },
      },
      {
        kind: 'question',
        title: 'Тест 1 из 3',
        prompt: 'Я пойду',
        answer: ['I', 'will', 'go'],
        bank: ['went', 'will', 'I', 'go', 'goes'],
      },
      {
        kind: 'question',
        title: 'Тест 2 из 3',
        prompt: 'Ты не увидишь',
        answer: ['You', 'will', 'not', 'see'],
        bank: ['see', 'not', 'You', 'saw', 'will', 'sees'],
      },
      {
        kind: 'question',
        title: 'Тест 3 из 3',
        prompt: 'Он не полюбит',
        answer: ['He', 'will', 'not', 'love'],
        bank: ['loves', 'He', 'not', 'love', 'will', 'loved'],
      },
    ],
  },
  {
    id: 'overview',
    name: 'Собираем общую схему',
    pages: [
      {
        kind: 'theory',
        title: 'Вспомогательные глаголы',
        paragraphs: ['После do, does, did и will используй начальную форму основного глагола.'],
        table: {
          headers: ['Время', 'Помощник'],
          rows: [
            ['Настоящее', 'do / does — в вопросах и отрицаниях'],
            ['Прошлое', 'did — в вопросах и отрицаниях'],
            ['Будущее', 'will'],
          ],
        },
      },
      ...buildMatrixQuestions(),
    ],
  },
]
