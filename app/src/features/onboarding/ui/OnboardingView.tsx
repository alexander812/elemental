import { useEffect, useMemo, useState } from 'react'

import { IconClose } from '@elemental/icons'
import { Button, ButtonIcon, Stack, Text } from '@elemental/ui-kit'

import { GENERAL_VIDEO_ID } from '../../knowledge/videos'
import { pushScreen } from '../../navigation/store'
import { onboardingCompleted } from '../store'

import classes from './OnboardingView.module.pcss'

const TITLE = 'Добро пожаловать в Лекси'
const DESCRIPTION =
  'Учите иностранные слова по флеш-карточкам: добавляйте готовые курсы или создавайте свои, проверяйте произношение и проходите тесты.'

const TYPE_DELAY_MS = 40
const TOTAL_LENGTH = TITLE.length + DESCRIPTION.length

export function OnboardingView() {
  const reduceMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const [charCount, setCharCount] = useState(() => (reduceMotion ? TOTAL_LENGTH : 0))

  useEffect(() => {
    if (reduceMotion || charCount >= TOTAL_LENGTH) return

    const timer = window.setTimeout(() => setCharCount((count) => count + 1), TYPE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [charCount, reduceMotion])

  const typed = charCount >= TOTAL_LENGTH
  const title = TITLE.slice(0, charCount)
  const description = DESCRIPTION.slice(0, Math.max(0, charCount - TITLE.length))

  const handleVideo = () => {
    onboardingCompleted()
    pushScreen({ name: 'knowledge', videoId: GENERAL_VIDEO_ID })
  }

  const handleKnowledge = () => {
    onboardingCompleted()
    pushScreen({ name: 'knowledge' })
  }

  return (
    <div className={classes.overlay}>
      <div className={classes.close}>
        <ButtonIcon
          ariaLabel="Закрыть"
          icon={<IconClose fontSize={24} />}
          variant="flat"
          onClick={() => onboardingCompleted()}
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
