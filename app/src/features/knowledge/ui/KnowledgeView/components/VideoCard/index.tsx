import { FormattedMessage } from 'react-intl'

import { IconPlay } from '@elemental/icons'
import { Card, Text } from '@elemental/ui-kit'

import type { KnowledgeVideo } from '../../../../videos'

import classes from './index.module.pcss'

type VideoCardProps = {
  onPlay: () => void
  video: KnowledgeVideo
}

export function VideoCard({ onPlay, video }: VideoCardProps) {
  return (
    <Card borderRadius="m" clipContent padding="0">
      <div className={classes.preview} onClick={onPlay}>
        <img alt="" className={classes.poster} decoding="async" loading="lazy" src={video.poster} />
        <div className={classes.scrim} />
        <div className={classes.playBadge}>
          <IconPlay fontSize={32} />
        </div>
        <div className={classes.title}>
          <Text variant="XL / CAPS">
            <FormattedMessage {...video.title} />
          </Text>
        </div>
      </div>
    </Card>
  )
}
