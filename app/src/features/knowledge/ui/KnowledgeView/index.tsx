import { useState } from 'react'

import { IconClose } from '@elemental/icons'
import { BottomSheet, Box, Header, Stack, Text } from '@elemental/ui-kit'

import { popScreen } from '../../../navigation/store'
import { KNOWLEDGE_VIDEOS } from '../../videos'
import type { KnowledgeVideo } from '../../videos'

import { VideoCard } from './components/VideoCard'

import classes from './index.module.pcss'

export function KnowledgeView() {
  const [activeVideo, setActiveVideo] = useState<KnowledgeVideo | null>(null)

  return (
    <Box grow height="100%">
      <Header back text="База знаний" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m">
          <Text color="contrast-secondary" variant="M / Medium">
            Видеоинструкции
          </Text>
          <div className={classes.list}>
            {KNOWLEDGE_VIDEOS.map((video) => (
              <VideoCard key={video.id} video={video} onPlay={() => setActiveVideo(video)} />
            ))}
          </div>
        </Stack>
      </Box>
      <BottomSheet
        fullHeight
        opened={activeVideo !== null}
        onClosed={() => setActiveVideo(null)}
      >
        {activeVideo ? (
          <div className={classes.player}>
            <video
              autoPlay
              className={classes.playerVideo}
              controls
              playsInline
              poster={activeVideo.poster}
            >
              <source src={activeVideo.src} type="video/mp4" />
              <source src={activeVideo.webm} type="video/webm" />
            </video>
            <button
              aria-label="Закрыть"
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
