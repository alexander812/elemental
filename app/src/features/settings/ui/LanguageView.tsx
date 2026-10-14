import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

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
      <Header
        back
        text={<FormattedMessage id="language_title" defaultMessage="Language" />}
        onBackClick={() => popScreen()}
      />
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
          <Stack spacing="s">
            <Text color="contrast-tertiary" variant="XS / Medium">
              <FormattedMessage
                id="language_hint"
                defaultMessage="Your language: the interface and new courses will be in it"
              />
            </Text>
            <Text color="contrast-tertiary" variant="XS / Medium">
              <FormattedMessage
                id="language_courses_hint"
                defaultMessage="Loaded courses keep their language pair — to change it, load the course again"
              />
            </Text>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
