import { useEffect } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'
import type { IntlShape } from 'react-intl'

import { IconCheck } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  FormHelperText,
  Header,
  ProgressBar,
  Stack,
  Text,
} from '@elemental/ui-kit'

import { isNativeBridgeAvailable } from '../../../lib/nativeBridge'
import { asrArtifactErrorDescriptor } from '../../../lib/recognitionErrors'
import {
  $asrArtifacts,
  downloadAsrFx,
  fetchAsrArtifactsFx,
} from '../../../shared/ui/RecognitionSheet'
import { popScreen } from '../../navigation/store'

const formatSize = (intl: IntlShape, sizeBytes: number) =>
  intl.formatMessage(
    { id: 'recognition_size_mb', defaultMessage: '{size} MB' },
    { size: Math.round(sizeBytes / 1024 / 1024) }
  )

export function RecognitionView() {
  const intl = useIntl()
  const artifacts = useUnit($asrArtifacts)
  const available = isNativeBridgeAvailable()

  useEffect(() => {
    if (available) fetchAsrArtifactsFx()
  }, [available])

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="recognition_title" defaultMessage="Speech recognition" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="m">
          <Text color="contrast-secondary" variant="S / Medium">
            <FormattedMessage
              id="recognition_description"
              defaultMessage="The models work offline: download them once and dictation with pronunciation check will work without the internet. There is a separate model for English — it is more accurate on short words."
            />
          </Text>
          {artifacts.map((artifact) => (
            <Card key={artifact.id} padding="l">
              <Stack
                direction="row"
                horizontalAlign="space-between"
                spacing="m"
                verticalAlign="center"
              >
                <Stack grow spacing="xs">
                  <Text variant="M / Medium">{artifact.title}</Text>
                  <Text color="contrast-tertiary" variant="XS / Medium">
                    {artifact.description} · {formatSize(intl, artifact.sizeBytes)}
                  </Text>
                </Stack>
                <Stack shrink={0}>
                  {artifact.installed ? (
                    <IconCheck color="var(--positive-text-and-icons)" fontSize={24} />
                  ) : artifact.downloading ? (
                    <Stack width={96}>
                      <ProgressBar value={artifact.progress} />
                      <Text align="end" color="contrast-secondary" variant="XS / Medium">
                        {Math.round(artifact.progress * 100)}%
                      </Text>
                    </Stack>
                  ) : (
                    <Button variant="secondary" onClick={() => downloadAsrFx(artifact.id)}>
                      <FormattedMessage id="recognition_download" defaultMessage="Download" />
                    </Button>
                  )}
                </Stack>
              </Stack>
              {artifact.error ? (
                <FormHelperText variant="error">
                  {intl.formatMessage(asrArtifactErrorDescriptor(artifact.error))}
                </FormHelperText>
              ) : null}
            </Card>
          ))}
          {!available ? (
            <FormHelperText variant="error">
              <FormattedMessage
                id="recognition_android_only"
                defaultMessage="Available only in the Android app"
              />
            </FormHelperText>
          ) : null}
        </Stack>
      </Box>
    </Box>
  )
}
