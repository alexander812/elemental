import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'

import { IconTranslate } from '@elemental/icons'

import { Box, Button, ButtonIcon, Header, Stack } from '@elemental/ui-kit'

import {
  DEFAULT_ORIGINAL_LANG,
  DEFAULT_TRANSLATION_LANG,
  getLanguageName,
} from '../../../lib/languages'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import { $sets, addCardFx, updateCardFx } from '../../sets/store'
import { translateFx } from '../store'

export function CardCreateView({ setId, cardId }: { setId: string; cardId?: string }) {
  const languages = useUnit($languages)
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
  const originalLang = set?.originalLang ?? DEFAULT_ORIGINAL_LANG
  const translationLang = set?.translationLang ?? DEFAULT_TRANSLATION_LANG

  const [original, setOriginal] = useState(() => card?.texts[originalLang] ?? '')
  const [translation, setTranslation] = useState(() => card?.texts[translationLang] ?? '')
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
      const result = await translateFx({ text: original, from: originalLang, to: translationLang })
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
        texts: { [originalLang]: original, [translationLang]: translation },
      })
    } else {
      await addCardFx({ setId, original, translation, originalLang, translationLang })
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
                lang={originalLang}
                placeholder={`Оригинал · ${getLanguageName(originalLang, languages)}`}
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
              lang={translationLang}
              placeholder={`Перевод · ${getLanguageName(translationLang, languages)}`}
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
