import type { MessageDescriptor } from 'react-intl'

export type KnowledgeVideo = {
  id: string
  title: MessageDescriptor
  src: string
  webm: string
  poster: string
}

const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`

export const GENERAL_VIDEO_ID = 'overview'
export const TASK_VIDEO_ID = 'task'

export const KNOWLEDGE_VIDEOS: KnowledgeVideo[] = [
  {
    id: GENERAL_VIDEO_ID,
    title: { id: 'knowledge_video_overview', defaultMessage: 'Getting to know Lexi' },
    src: asset('videos/overview.mp4'),
    webm: asset('videos/overview.webm'),
    poster: asset('videos/overview.jpg'),
  },
  {
    id: 'add-ready-course',
    title: { id: 'knowledge_video_add_ready_course', defaultMessage: 'Adding a ready-made course' },
    src: asset('videos/add-ready-course.mp4'),
    webm: asset('videos/add-ready-course.webm'),
    poster: asset('videos/add-ready-course.jpg'),
  },
  {
    id: TASK_VIDEO_ID,
    title: { id: 'knowledge_video_task', defaultMessage: 'Working with sets' },
    src: asset('videos/task.mp4'),
    webm: asset('videos/task.webm'),
    poster: asset('videos/task.jpg'),
  },
  {
    id: 'settings',
    title: { id: 'knowledge_video_settings', defaultMessage: 'Settings and data' },
    src: asset('videos/settings.mp4'),
    webm: asset('videos/settings.webm'),
    poster: asset('videos/settings.jpg'),
  },
]
