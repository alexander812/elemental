import { useEffect, useState } from 'react'

import { FormattedMessage, useIntl } from 'react-intl'

import { IconClose } from '@elemental/icons'
import { BottomSheet, Box, Header, Stack, Text } from '@elemental/ui-kit'

import { popScreen } from '../../../navigation/store'
import { knowledgeOpened } from '../../../progression/store'
import { getKnowledgeVideoVariant, KNOWLEDGE_VIDEOS } from '../../videos'
import type { KnowledgeVideo } from '../../videos'

import { VideoCard } from './components/VideoCard'

import classes from './index.module.pcss'

export function KnowledgeView({ videoId }: { videoId?: string }) {
  const intl = useIntl()
  const [activeVideo, setActiveVideo] = useState<KnowledgeVideo | null>(
    () => KNOWLEDGE_VIDEOS.find((video) => video.id === videoId) ?? null
  )
  const activeMedia = activeVideo
    ? getKnowledgeVideoVariant(activeVideo, intl.locale)
    : null

  useEffect(() => {
    knowledgeOpened()
  }, [])

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="knowledge_title" defaultMessage="Knowledge base" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="m">
          <Text color="contrast-secondary" variant="M / Medium">
            <FormattedMessage id="knowledge_video_tutorials" defaultMessage="Video tutorials" />
          </Text>
          <div className={classes.list}>
            {KNOWLEDGE_VIDEOS.map((video) => (
              <VideoCard
                key={video.id}
                media={getKnowledgeVideoVariant(video, intl.locale)}
                video={video}
                onPlay={() => setActiveVideo(video)}
              />
            ))}
          </div>
        </Stack>
      </Box>
      <BottomSheet
        fullHeight
        opened={activeVideo !== null}
        onClosed={() => setActiveVideo(null)}
      >
        {activeVideo && activeMedia ? (
          <div className={classes.player}>
            <video
              autoPlay
              className={classes.playerVideo}
              controls
              playsInline
              poster={activeMedia.poster}
            >
              <source src={activeMedia.src} type="video/mp4" />
            </video>
            <button
              aria-label={intl.formatMessage({ id: 'common_close', defaultMessage: 'Close' })}
              className={classes.close}
              type="button"
              onClick={() => setActiveVideo(null)}
            >
              <IconClose fontSize={24} />
            </button>
          </div>
        ) : null}
      </BottomSheet>
    </Box>
  )
}
