export type KnowledgeVideo = {
  id: string
  title: string
  src: string
  webm: string
  poster: string
}

const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`

export const KNOWLEDGE_VIDEOS: KnowledgeVideo[] = [
  {
    id: 'add-ready-course',
    title: 'Добавление готового курса',
    src: asset('videos/add-ready-course.mp4'),
    webm: asset('videos/add-ready-course.webm'),
    poster: asset('videos/add-ready-course.jpg'),
  },
]
