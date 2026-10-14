import { useEffect, useMemo, useState } from 'react'

import { FormattedMessage, useIntl } from 'react-intl'
import type { MessageDescriptor } from 'react-intl'

import { IconClose } from '@elemental/icons'
import { Button, ButtonIcon, Stack, Text } from '@elemental/ui-kit'

import { GENERAL_VIDEO_ID, TASK_VIDEO_ID } from '../../knowledge/videos'
import { pushScreen } from '../../navigation/store'
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

  useEffect(() => {
    if (reduceMotion || charCount >= totalLength) return

    const timer = window.setTimeout(() => setCharCount((count) => count + 1), TYPE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [charCount, reduceMotion, totalLength])

  const typed = charCount >= totalLength
  const title = fullTitle.slice(0, charCount)
  const description = fullDescription.slice(0, Math.max(0, charCount - fullTitle.length))

  const handleVideo = () => {
    completeOnboarding(variant)
    pushScreen({ name: 'knowledge', videoId })
  }

  const handleKnowledge = () => {
    completeOnboarding(variant)
    pushScreen({ name: 'knowledge' })
  }

  return (
    <div className={classes.overlay}>
      <div className={classes.close}>
        <ButtonIcon
          ariaLabel={intl.formatMessage({ id: 'common_close', defaultMessage: 'Close' })}
          icon={<IconClose fontSize={24} />}
          variant="flat"
          onClick={() => completeOnboarding(variant)}
        />
      </div>

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
          <Button fullWidth variant="secondary" onClick={handleKnowledge}>
            <FormattedMessage
              id="onboarding_open_knowledge"
              defaultMessage="Open the knowledge base"
            />
          </Button>
        </Stack>
      </div>
    </div>
  )
}
