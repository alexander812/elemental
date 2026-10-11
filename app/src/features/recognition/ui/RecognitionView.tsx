import { useEffect } from 'react'

import { useUnit } from 'effector-react'

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
import { asrArtifactErrorText } from '../../../lib/recognitionErrors'
import {
  $asrArtifacts,
  downloadAsrFx,
  fetchAsrArtifactsFx,
} from '../../../shared/ui/RecognitionSheet'
import { popScreen } from '../../navigation/store'

const formatSize = (sizeBytes: number) => `${Math.round(sizeBytes / 1024 / 1024)} МБ`

export function RecognitionView() {
  const artifacts = useUnit($asrArtifacts)
  const available = isNativeBridgeAvailable()

  useEffect(() => {
    if (available) fetchAsrArtifactsFx()
  }, [available])

  return (
    <Box grow height="100%">
      <Header back text="Распознавание речи" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m">
          <Text color="contrast-secondary" variant="S / Medium">
            Модели работают офлайн: скачайте один раз, и диктовка с проверкой произношения будет без
            интернета. Для английского есть отдельная модель — она точнее на коротких словах.
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
                    {artifact.description} · {formatSize(artifact.sizeBytes)}
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
                      Загрузить
                    </Button>
                  )}
                </Stack>
              </Stack>
              {artifact.error ? (
                <FormHelperText variant="error">
                  {asrArtifactErrorText(artifact.error)}
                </FormHelperText>
              ) : null}
            </Card>
          ))}
          {!available ? (
            <FormHelperText variant="error">Доступно только в Android-приложении</FormHelperText>
          ) : null}
        </Stack>
      </Box>
    </Box>
  )
}
