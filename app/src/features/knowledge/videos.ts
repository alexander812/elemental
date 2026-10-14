export type KnowledgeVideo = {
  id: string
  title: string
  src: string
  webm: string
  poster: string
}

const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`

export const GENERAL_VIDEO_ID = 'overview'

export const KNOWLEDGE_VIDEOS: KnowledgeVideo[] = [
  {
    id: GENERAL_VIDEO_ID,
    title: 'Знакомство с Lexi',
    src: asset('videos/overview.mp4'),
    webm: asset('videos/overview.webm'),
    poster: asset('videos/overview.jpg'),
  },
  {
    id: 'add-ready-course',
    title: 'Добавление готового курса',
    src: asset('videos/add-ready-course.mp4'),
    webm: asset('videos/add-ready-course.webm'),
    poster: asset('videos/add-ready-course.jpg'),
  },
  {
    id: 'task',
    title: 'Работа с заданиями',
    src: asset('videos/task.mp4'),
    webm: asset('videos/task.webm'),
    poster: asset('videos/task.jpg'),
  },
]
