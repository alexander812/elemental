import { useUnit } from 'effector-react'

import { IconTranslate } from '@elemental/icons'

import { Box, Button, Divider, FormHelperText, Header, Stack } from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $languages } from '../../languages/store'
import { popScreen, popTo } from '../../navigation/store'
import { addCardsFx, $courseLangByLesson, $sets } from '../../sets/store'
import { $userLang } from '../../theme/store'
import {
  pairOriginalChanged,
  pairTranslationChanged,
  resetTextAdd,
  translateAllFx,
  $pairs,
  $translateFailed,
} from '../store'

export function WordsTranslateView({ setId }: { setId: string }) {
  const pairs = useUnit($pairs)
  const translateFailed = useUnit($translateFailed)
  const translating = useUnit(translateAllFx.pending)
  const adding = useUnit(addCardsFx.pending)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const sets = useUnit($sets)
  const set = sets.find((item) => item.id === setId)
  const courseLang = (set ? courseLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_COURSE_LANG

  const canTranslate = pairs.some(
    (pair) => pair.original.trim().length > 0 || pair.translation.trim().length > 0
  )
  const canAdd =
    pairs.length > 0 &&
    pairs.every((pair) => pair.original.trim().length > 0 && pair.translation.trim().length > 0)

  const handleTranslateAll = () => {
    translateAllFx({ pairs, userLang, courseLang })
  }

  const handleAdd = async () => {
    if (!canAdd) return

    await addCardsFx({
      setId,
      texts: pairs.map((pair) => ({
        [userLang]: pair.original,
        [courseLang]: pair.translation,
      })),
    })

    resetTextAdd()
    popTo('cards')
  }

  return (
    <Box grow height="100%">
      <Header back text="Проверьте перевод" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="l">
          {pairs.map((pair, index) => (
            <Stack key={pair.id} spacing="s">
              {index > 0 ? <Divider /> : null}
              <InputWithVoice
                floatingLabel
                fullWidth
                lang={userLang}
                placeholder={getLanguageName(userLang, languages)}
                size="m"
                value={pair.original}
                onChange={(value) => pairOriginalChanged({ id: pair.id, value })}
              />
              <InputWithVoice
                floatingLabel
                fullWidth
                lang={courseLang}
                placeholder={getLanguageName(courseLang, languages)}
                size="m"
                value={pair.translation}
                onChange={(value) => pairTranslationChanged({ id: pair.id, value })}
              />
            </Stack>
          ))}

          {translateFailed ? (
            <FormHelperText variant="error">
              Не удалось перевести часть слов — введите перевод вручную
            </FormHelperText>
          ) : null}

          <Button
            disabled={!canTranslate}
            fullWidth
            loading={translating}
            startIcon={<IconTranslate fontSize={24} />}
            variant="secondary"
            onClick={handleTranslateAll}
          >
            Перевести все
          </Button>

          <Button disabled={!canAdd} fullWidth loading={adding} onClick={handleAdd}>
            Добавить
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
