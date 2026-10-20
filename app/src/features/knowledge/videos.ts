import type { MessageDescriptor } from 'react-intl'

export type KnowledgeVideoVariant = {
  src: string
  poster: string
}

export type KnowledgeVideo = {
  id: string
  title: MessageDescriptor
  variants: {
    ru: KnowledgeVideoVariant
    en: KnowledgeVideoVariant
  }
}

const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`

const variant = (id: string, locale: 'ru' | 'en'): KnowledgeVideoVariant => ({
  src: asset(`videos/${locale}/${id}.mp4`),
  poster: asset(`videos/${locale}/${id}.jpg`),
})

const video = (id: string, title: MessageDescriptor): KnowledgeVideo => ({
  id,
  title,
  variants: {
    ru: variant(id, 'ru'),
    en: variant(id, 'en'),
  },
})

export const GENERAL_VIDEO_ID = 'overview'
export const TASK_VIDEO_ID = 'task'

export const getKnowledgeVideoVariant = (
  videoItem: KnowledgeVideo,
  locale: string
): KnowledgeVideoVariant =>
  locale.split('-')[0] === 'ru' ? videoItem.variants.ru : videoItem.variants.en

export const KNOWLEDGE_VIDEOS: KnowledgeVideo[] = [
  video(GENERAL_VIDEO_ID, {
    id: 'knowledge_video_overview',
    defaultMessage: 'Getting to know Lexi',
  }),
  video('add-ready-course', {
    id: 'knowledge_video_add_ready_course',
    defaultMessage: 'Adding a ready-made course',
  }),
  video(TASK_VIDEO_ID, { id: 'knowledge_video_task', defaultMessage: 'Working with sets' }),
  video('settings', { id: 'knowledge_video_settings', defaultMessage: 'Settings and data' }),
]
