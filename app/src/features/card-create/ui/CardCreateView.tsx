import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { Box, Button, FormHelperText, Header, Stack } from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, DEFAULT_USER_LANG, getLanguageName } from '../../../lib/languages'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import {
  $courseLangByLesson,
  $sets,
  $userLangByLesson,
  addCardFx,
  updateCardFx,
} from '../../sets/store'
import { translateFx } from '../store'

type TranslateField = 'original' | 'translation'

export function CardCreateView({ setId, cardId }: { setId: string; cardId?: string }) {
  const languages = useUnit($languages)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const userLangByLesson = useUnit($userLangByLesson)
  const sets = useUnit($sets)
  const pending = useUnit(addCardFx.pending)
  const updatePending = useUnit(updateCardFx.pending)

  const card = useMemo(
    () =>
      cardId
        ? sets.find((item) => item.id === setId)?.cards.find((item) => item.id === cardId)
        : undefined,
    [sets, setId, cardId]
  )

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])
  const courseLang = (set ? courseLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_COURSE_LANG
  const courseUserLang = (set ? userLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_USER_LANG

  const [original, setOriginal] = useState(() => card?.texts[courseUserLang] ?? '')
  const [translation, setTranslation] = useState(() => card?.texts[courseLang] ?? '')
  const [translationFailed, setTranslationFailed] = useState(false)
  const [translatingField, setTranslatingField] = useState<TranslateField | null>(null)

  const isEditing = Boolean(card)
  const canSave = original.trim().length > 0 && translation.trim().length > 0
  const canTranslateOriginal = translation.trim().length > 0
  const canTranslateTranslation = original.trim().length > 0

  const handleOriginalChange = (value: string) => {
    setOriginal(value)
    setTranslationFailed(false)
  }

  const handleTranslationChange = (value: string) => {
    setTranslation(value)
    setTranslationFailed(false)
  }

  const handleTranslate = async (field: TranslateField) => {
    const source = field === 'original' ? translation.trim() : original.trim()

    if (!source) return

    const from = field === 'original' ? courseLang : courseUserLang
    const to = field === 'original' ? courseUserLang : courseLang

    setTranslationFailed(false)
    setTranslatingField(field)

    try {
      const result = await translateFx({ text: source, from, to })

      if (field === 'original') setOriginal(result)
      else setTranslation(result)
    } catch {
      setTranslationFailed(true)
    } finally {
      setTranslatingField(null)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canSave) return

    if (isEditing && card) {
      await updateCardFx({
        setId,
        cardId: card.id,
        texts: { [courseUserLang]: original, [courseLang]: translation },
      })
    } else {
      await addCardFx({ setId, texts: { [courseUserLang]: original, [courseLang]: translation } })
    }

    popScreen()
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={
          isEditing ? (
            <FormattedMessage id="cards_edit" defaultMessage="Edit" />
          ) : (
            <FormattedMessage id="common_add" defaultMessage="Add" />
          )
        }
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <InputWithVoice
              autoFocus
              canTranslate={canTranslateOriginal}
              floatingLabel
              fullWidth
              lang={courseUserLang}
              placeholder={getLanguageName(courseUserLang, languages)}
              size="m"
              translating={translatingField === 'original'}
              value={original}
              onChange={handleOriginalChange}
              onTranslate={() => handleTranslate('original')}
            />
            <InputWithVoice
              canTranslate={canTranslateTranslation}
              floatingLabel
              fullWidth
              lang={courseLang}
              placeholder={getLanguageName(courseLang, languages)}
              size="m"
              translating={translatingField === 'translation'}
              value={translation}
              onChange={handleTranslationChange}
              onTranslate={() => handleTranslate('translation')}
            />
            {translationFailed ? (
              <FormHelperText variant="error">
                <FormattedMessage
                  id="card_create_translate_failed"
                  defaultMessage="Translation failed — enter the translation manually"
                />
              </FormHelperText>
            ) : null}
            <Button disabled={!canSave} fullWidth loading={pending || updatePending} type="submit">
              <FormattedMessage id="common_save" defaultMessage="Save" />
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
