import { useMemo, useState } from 'react'

import { useUnit } from 'effector-react'

import { Box, Button, Card, FormHelperText, Header, Select, Stack, Text } from '@elemental/ui-kit'

import type { LanguageCode } from '../../../lib/languages'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import { setLanguagesFx, $originalLang, $translationLang } from '../../theme/store'

export function LanguagesView() {
  const languages = useUnit($languages)
  const storedOriginalLang = useUnit($originalLang)
  const storedTranslationLang = useUnit($translationLang)
  const pending = useUnit(setLanguagesFx.pending)

  const [originalLang, setOriginalLang] = useState<LanguageCode>(storedOriginalLang)
  const [translationLang, setTranslationLang] = useState<LanguageCode>(storedTranslationLang)

  const options = useMemo(
    () => languages.map((language) => ({ label: language.name, value: language.code })),
    [languages]
  )

  const sameLanguages = originalLang === translationLang
  const changed = originalLang !== storedOriginalLang || translationLang !== storedTranslationLang
  const canApply = changed && !sameLanguages

  const handleApply = async () => {
    if (!canApply) return

    await setLanguagesFx({ originalLang, translationLang })
    popScreen()
  }

  return (
    <Box grow height="100%">
      <Header back text="Языки" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m" height="100%">
          <Card padding="l">
            <Stack spacing="l">
              <Text color="contrast-secondary" variant="S / Medium">
                Язык оригинала
              </Text>
              <Select
                fullWidth
                options={options}
                value={originalLang}
                onChange={(value) => setOriginalLang(value as LanguageCode)}
              />
            </Stack>
          </Card>
          <Card padding="l">
            <Stack spacing="l">
              <Text color="contrast-secondary" variant="S / Medium">
                Язык перевода
              </Text>
              <Select
                fullWidth
                options={options}
                value={translationLang}
                onChange={(value) => setTranslationLang(value as LanguageCode)}
              />
            </Stack>
          </Card>
          {sameLanguages && (
            <FormHelperText variant="error">
              Языки оригинала и перевода должны различаться
            </FormHelperText>
          )}
          <Button disabled={!canApply} fullWidth loading={pending} onClick={handleApply}>
            Применить
          </Button>
          <Text align="center" color="contrast-tertiary" variant="XS / Medium">
            Используются по умолчанию при создании набора
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}
