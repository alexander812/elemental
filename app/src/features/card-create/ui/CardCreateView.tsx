import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'

import { IconTranslate } from '@elemental/icons'

import { Box, Button, ButtonIcon, Header, Stack } from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import { $courseLangByLesson, $sets, addCardFx, updateCardFx } from '../../sets/store'
import { $userLang } from '../../theme/store'
import { translateFx } from '../store'

export function CardCreateView({ setId, cardId }: { setId: string; cardId?: string }) {
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const sets = useUnit($sets)
  const pending = useUnit(addCardFx.pending)
  const updatePending = useUnit(updateCardFx.pending)
  const translationPending = useUnit(translateFx.pending)

  const card = useMemo(
    () =>
      cardId
        ? sets.find((item) => item.id === setId)?.cards.find((item) => item.id === cardId)
        : undefined,
    [sets, setId, cardId]
  )

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])
  const courseLang = (set ? courseLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_COURSE_LANG

  const [original, setOriginal] = useState(() => card?.texts[userLang] ?? '')
  const [translation, setTranslation] = useState(() => card?.texts[courseLang] ?? '')
  const [translationFailed, setTranslationFailed] = useState(false)

  const isEditing = Boolean(card)
  const canTranslate = original.trim().length > 0
  const canSave = canTranslate && translation.trim().length > 0

  const handleOriginalChange = (value: string) => {
    setOriginal(value)
    setTranslationFailed(false)
  }

  const handleTranslationChange = (value: string) => {
    setTranslation(value)
    setTranslationFailed(false)
  }

  const handleTranslate = async () => {
    if (!canTranslate) return

    setTranslationFailed(false)

    try {
      const result = await translateFx({ text: original, from: userLang, to: courseLang })
      setTranslation(result)
    } catch {
      setTranslationFailed(true)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canSave) return

    if (isEditing && card) {
      await updateCardFx({
        setId,
        cardId: card.id,
        texts: { [userLang]: original, [courseLang]: translation },
      })
    } else {
      await addCardFx({ setId, texts: { [userLang]: original, [courseLang]: translation } })
    }

    popScreen()
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={isEditing ? 'Изменить слово' : 'Добавить слово'}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <Stack direction="row" spacing="s" verticalAlign="center">
              <InputWithVoice
                autoFocus
                floatingLabel
                fullWidth
                lang={userLang}
                placeholder={getLanguageName(userLang, languages)}
                size="m"
                value={original}
                onChange={handleOriginalChange}
              />
              <ButtonIcon
                ariaLabel="Перевести"
                disabled={!canTranslate}
                icon={<IconTranslate fontSize={24} />}
                loading={translationPending}
                round
                size="m"
                variant="secondary"
                onClick={handleTranslate}
              />
            </Stack>
            <InputWithVoice
              floatingLabel
              fullWidth
              helperText={
                translationFailed ? 'Не удалось перевести — введите перевод вручную' : undefined
              }
              lang={courseLang}
              placeholder={getLanguageName(courseLang, languages)}
              size="m"
              value={translation}
              onChange={handleTranslationChange}
            />
            <Button disabled={!canSave} fullWidth loading={pending || updatePending} type="submit">
              Сохранить
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
