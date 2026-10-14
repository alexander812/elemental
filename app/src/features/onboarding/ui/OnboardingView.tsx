import { useEffect, useMemo, useState } from 'react'

import { IconClose } from '@elemental/icons'
import { Button, ButtonIcon, Stack, Text } from '@elemental/ui-kit'

import { GENERAL_VIDEO_ID, TASK_VIDEO_ID } from '../../knowledge/videos'
import { pushScreen } from '../../navigation/store'
import { onboardingCompleted, taskOnboardingCompleted } from '../store'

import classes from './OnboardingView.module.pcss'

export type OnboardingVariant = 'general' | 'task'

type OnboardingContent = {
  title: string
  description: string
  videoId: string
}

const CONTENT: Record<OnboardingVariant, OnboardingContent> = {
  general: {
    title: 'Добро пожаловать в Лекси',
    description:
      'Учите иностранные слова по флеш-карточкам: добавляйте готовые курсы или создавайте свои, проверяйте произношение и проходите тесты.',
    videoId: GENERAL_VIDEO_ID,
  },
  task: {
    title: 'Как работать с заданием',
    description:
      'Текст — главное в задании, а карточки помогут выучить слова из него. Листайте их свайпами, проверяйте произношение и проходите тест.',
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
  const { title: fullTitle, description: fullDescription, videoId } = CONTENT[variant]
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
          ariaLabel="Закрыть"
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
            Смотреть видео
          </Button>
          <Button fullWidth variant="secondary" onClick={handleKnowledge}>
            Открыть базу знаний
          </Button>
        </Stack>
      </div>
    </div>
  )
}
