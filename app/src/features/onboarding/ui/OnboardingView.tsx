import { useEffect, useMemo, useState } from 'react'

import { FormattedMessage, useIntl } from 'react-intl'
import type { MessageDescriptor } from 'react-intl'

import { IconClose } from '@elemental/icons'
import { Button, ButtonIcon, Stack, Text } from '@elemental/ui-kit'

import {
  GENERAL_VIDEO_ID,
  getKnowledgeVideoVariant,
  KNOWLEDGE_VIDEOS,
  TASK_VIDEO_ID,
} from '../../knowledge/videos'
import { goToRoot } from '../../navigation/store'
import { onboardingCompleted, taskOnboardingCompleted } from '../store'

import classes from './OnboardingView.module.pcss'

export type OnboardingVariant = 'general' | 'task'

type OnboardingContent = {
  title: MessageDescriptor
  description: MessageDescriptor
  videoId: string
}

const CONTENT: Record<OnboardingVariant, OnboardingContent> = {
  general: {
    title: { id: 'onboarding_general_title', defaultMessage: 'Welcome to Lexi' },
    description: {
      id: 'onboarding_general_description',
      defaultMessage:
        'Learn foreign words with flashcards: add ready-made courses or create your own, check pronunciation and take tests.',
    },
    videoId: GENERAL_VIDEO_ID,
  },
  task: {
    title: { id: 'onboarding_task_title', defaultMessage: 'How to work with a set' },
    description: {
      id: 'onboarding_task_description',
      defaultMessage:
        'The text is the main part of a set, and the cards help you learn the words from it. Swipe through them, check pronunciation and take the test.',
    },
    videoId: TASK_VIDEO_ID,
  },
}

const TYPE_DELAY_MS = 40

const completeOnboarding = (variant: OnboardingVariant) => {
  if (variant === 'task') {
    taskOnboardingCompleted()
  } else {
    onboardingCompleted()
  }
}

export function OnboardingView({ variant = 'general' }: { variant?: OnboardingVariant }) {
  const intl = useIntl()
  const { title: titleDescriptor, description: descriptionDescriptor, videoId } = CONTENT[variant]
  const fullTitle = intl.formatMessage(titleDescriptor)
  const fullDescription = intl.formatMessage(descriptionDescriptor)
  const totalLength = fullTitle.length + fullDescription.length

  const reduceMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const [charCount, setCharCount] = useState(() => (reduceMotion ? totalLength : 0))
  const [videoOpen, setVideoOpen] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  const video = useMemo(
    () => KNOWLEDGE_VIDEOS.find((item) => item.id === videoId) ?? null,
    [videoId]
  )
  const media = video ? getKnowledgeVideoVariant(video, intl.locale) : null

  useEffect(() => {
    if (reduceMotion || charCount >= totalLength) return

    const timer = window.setTimeout(() => setCharCount((count) => count + 1), TYPE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [charCount, reduceMotion, totalLength])

  const typed = charCount >= totalLength
  const title = fullTitle.slice(0, charCount)
  const description = fullDescription.slice(0, Math.max(0, charCount - fullTitle.length))

  const complete = () => {
    completeOnboarding(variant)

    if (variant === 'general') goToRoot()
  }

  const handleVideo = () => {
    setVideoEnded(false)
    setVideoOpen(true)
  }

  return (
    <div className={classes.overlay}>
      <div className={classes.close}>
        <ButtonIcon
          ariaLabel={intl.formatMessage({ id: 'common_close', defaultMessage: 'Close' })}
          color={videoOpen ? 'onAccent' : undefined}
          icon={<IconClose fontSize={24} />}
          variant="flat"
          onClick={complete}
        />
      </div>

      {videoOpen && video && media ? (
        <div className={classes.videoLayer}>
          <video
            autoPlay
            className={classes.videoPlayer}
            controls
            playsInline
            poster={media.poster}
            onEnded={() => setVideoEnded(true)}
          >
            <source src={media.src} type="video/mp4" />
          </video>
          {videoEnded ? (
            <div className={classes.videoActions}>
              <Button fullWidth onClick={complete}>
                <FormattedMessage id="common_close" defaultMessage="Close" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <Stack grow horizontalAlign="center" spacing="l" verticalAlign="start">
            <img
              alt=""
              className={classes.emblem}
              src={`${import.meta.env.BASE_URL}icons/emblem.svg`}
            />
            <div className={classes.title}>
              <Text as="h1" variant="XL / Medium">
                {title}
                {typed ? null : <span className={classes.caret} />}
              </Text>
            </div>
            <div className={classes.description}>
              <Text color="contrast-secondary" variant="M / Medium">
                {description}
              </Text>
            </div>
          </Stack>

          <div className={`${classes.actions} ${typed ? classes.actionsVisible : ''}`}>
            <Stack spacing="s">
              <Button fullWidth onClick={handleVideo}>
                <FormattedMessage id="onboarding_watch_video" defaultMessage="Watch video" />
              </Button>
              <Button fullWidth variant="secondary" onClick={complete}>
                <FormattedMessage id="onboarding_skip" defaultMessage="Skip" />
              </Button>
            </Stack>
          </div>
        </>
      )}
    </div>
  )
}
