import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { BottomSheet, Box, Button, FormHelperText, ProgressBar, Stack, Text } from '@elemental/ui-kit'

import { asrArtifactErrorDescriptor } from '../../../lib/recognitionErrors'

import { $asrError, $asrProgress, $asrSheetOpened, asrSheetClosed } from './model'

export type RecognitionSheetProps = {
  onOpenSettings: () => void
}

export function RecognitionSheet({ onOpenSettings }: RecognitionSheetProps) {
  const opened = useUnit($asrSheetOpened)
  const progress = useUnit($asrProgress)
  const error = useUnit($asrError)
  const intl = useIntl()

  const handleOpenSettings = () => {
    asrSheetClosed()
    onOpenSettings()
  }

  return (
    <BottomSheet opened={opened} onClosed={() => asrSheetClosed()}>
      <Box padding="l">
        <Stack spacing="m">
          <Text align="center" variant="M / Medium">
            {progress === null
              ? intl.formatMessage({
                  id: 'asr_sheet_not_downloaded',
                  defaultMessage: "Speech recognition isn't downloaded",
                })
              : intl.formatMessage({
                  id: 'asr_sheet_downloading',
                  defaultMessage: 'Downloading speech recognition',
                })}
          </Text>
          <Text align="center" color="contrast-secondary" variant="S / Medium">
            {progress === null
              ? intl.formatMessage({
                  id: 'asr_sheet_download_hint',
                  defaultMessage:
                    'Download the model once and dictation with pronunciation check will work offline.',
                })
              : intl.formatMessage({
                  id: 'asr_sheet_downloading_hint',
                  defaultMessage:
                    'The model downloads once and works offline. Tap the microphone again after it loads.',
                })}
          </Text>
          <ProgressBar value={progress ?? 0} />
          <Text align="center" color="contrast-secondary" variant="XS / Medium">
            {progress === null
              ? intl.formatMessage({
                  id: 'asr_sheet_status_not_downloaded',
                  defaultMessage: 'Not downloaded',
                })
              : intl.formatMessage(
                  {
                    id: 'asr_sheet_status_progress',
                    defaultMessage: 'Loading… {percent}%',
                  },
                  { percent: Math.round(progress * 100) }
                )}
          </Text>
          {error ? (
            <FormHelperText variant="error">
              {intl.formatMessage(asrArtifactErrorDescriptor(error))}
            </FormHelperText>
          ) : null}
          <Button fullWidth onClick={handleOpenSettings}>
            <FormattedMessage
              id="asr_sheet_settings"
              defaultMessage="Speech recognition settings"
            />
          </Button>
        </Stack>
      </Box>
    </BottomSheet>
  )
}
