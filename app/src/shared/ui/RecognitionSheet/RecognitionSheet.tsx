import { useUnit } from 'effector-react'

import { BottomSheet, Box, Button, FormHelperText, ProgressBar, Stack, Text } from '@elemental/ui-kit'

import { asrArtifactErrorText } from '../../../lib/recognitionErrors'

import { $asrError, $asrProgress, $asrSheetOpened, asrSheetClosed } from './model'

export type RecognitionSheetProps = {
  onOpenSettings: () => void
}

export function RecognitionSheet({ onOpenSettings }: RecognitionSheetProps) {
  const opened = useUnit($asrSheetOpened)
  const progress = useUnit($asrProgress)
  const error = useUnit($asrError)

  const handleOpenSettings = () => {
    asrSheetClosed()
    onOpenSettings()
  }

  return (
    <BottomSheet opened={opened} onClosed={() => asrSheetClosed()}>
      <Box padding="l">
        <Stack spacing="m">
          <Text align="center" variant="M / Medium">
            {progress === null ? 'Распознавание речи не загружено' : 'Загружаю распознавание речи'}
          </Text>
          <Text align="center" color="contrast-secondary" variant="S / Medium">
            {progress === null
              ? 'Скачайте модель один раз — и диктовка с проверкой произношения будет работать офлайн.'
              : 'Модель скачивается один раз и работает офлайн. После загрузки повторите нажатие на микрофон.'}
          </Text>
          <ProgressBar value={progress ?? 0} />
          <Text align="center" color="contrast-secondary" variant="XS / Medium">
            {progress === null ? 'Не загружено' : `Загрузка… ${Math.round(progress * 100)}%`}
          </Text>
          {error ? (
            <FormHelperText variant="error">{asrArtifactErrorText(error)}</FormHelperText>
          ) : null}
          <Button fullWidth onClick={handleOpenSettings}>
            Настройки распознавания
          </Button>
        </Stack>
      </Box>
    </BottomSheet>
  )
}
