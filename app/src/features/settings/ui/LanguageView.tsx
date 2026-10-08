import { useUnit } from 'effector-react'

import { Box, Card, Header, Radio, Stack, Text } from '@elemental/ui-kit'

import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import { $userLang, setUserLangFx } from '../../theme/store'

export function LanguageView() {
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)

  const handleChange = (value: string) => {
    setUserLangFx(value)
  }

  return (
    <Box grow height="100%">
      <Header back text="Язык" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m">
          <Card padding="l">
            <Radio name="user-lang" value={userLang} onChange={handleChange}>
              <Stack spacing="l">
                {languages.map((language) => (
                  <Radio.Option key={language.code} label={language.name} value={language.code} />
                ))}
              </Stack>
            </Radio>
          </Card>
          <Text color="contrast-tertiary" variant="XS / Medium">
            Ваш язык: переводы и подсказки будут на нём
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}
