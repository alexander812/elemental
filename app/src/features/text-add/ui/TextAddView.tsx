import { useState } from 'react'

import { useUnit } from 'effector-react'

import { IconScan } from '@elemental/icons'

import {
  Button,
  FormHelperText,
  Header,
  Select,
  Stack,
  Text,
  Textarea,
} from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import { isNativeBridgeAvailable } from '../../../lib/nativeBridge'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import type { TextAddDraft } from '../../navigation/store'
import { draftTextSaved } from '../../set-create/store'
import { $courseLangByLesson, $sets, updateSetTextFx } from '../../sets/store'
import { $userLang } from '../../theme/store'
import {
  scanTextFx,
  textChanged,
  textLangChanged,
  $scanFailed,
  $text,
  $textLang,
} from '../store'

import classes from './TextAddView.module.pcss'

type TextAddViewProps =
  | { setId: string; draft?: undefined }
  | { setId?: undefined; draft: TextAddDraft }

export function TextAddView({ setId, draft }: TextAddViewProps) {
  const text = useUnit($text)
  const storedLang = useUnit($textLang)
  const sets = useUnit($sets)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const scanPending = useUnit(scanTextFx.pending)
  const scanFailed = useUnit($scanFailed)
  const saving = useUnit(updateSetTextFx.pending)

  const set = setId ? sets.find((item) => item.id === setId) : undefined
  const courseLang =
    (set ? courseLangByLesson.get(set.lessonId) : undefined) ??
    draft?.courseLang ??
    DEFAULT_COURSE_LANG
  const lang = storedLang ?? courseLang
  const langOptions = [
    { label: getLanguageName(courseLang, languages), value: courseLang },
    { label: getLanguageName(userLang, languages), value: userLang },
  ]

  const scanAvailable = isNativeBridgeAvailable()
  const [wasEditing] = useState(() => text.trim().length > 0)

  const handleSave = async () => {
    if (!text.trim()) return

    if (setId) {
      await updateSetTextFx({ lang, setId, text })
      popScreen()
      return
    }

    draftTextSaved({ lang, text })
    popScreen()
  }

  return (
    <div className={classes.root}>
      <Header
        back
        text={wasEditing ? 'Изменить текст' : 'Добавить текст'}
        onBackClick={() => popScreen()}
      />
      <div className={classes.layout}>
        <div className={classes.inputScroll}>
          <Stack spacing="l">
            <Textarea
              fullWidth
              placeholder="Введите или вставьте текст"
              rows={6}
              value={text}
              onChange={textChanged}
            />
            <Stack spacing="s">
              <Text color="contrast-secondary" variant="XS / Medium">
                Язык текста
              </Text>
              <Select fullWidth options={langOptions} value={lang} onChange={textLangChanged} />
            </Stack>
            {scanAvailable ? (
              <Button
                disabled={scanPending}
                fullWidth
                loading={scanPending}
                startIcon={<IconScan fontSize={24} />}
                variant="secondary"
                onClick={() => scanTextFx(lang)}
              >
                Сканировать текст
              </Button>
            ) : null}
            {scanFailed ? (
              <FormHelperText variant="error">Не удалось распознать текст</FormHelperText>
            ) : null}
            <Button disabled={!text.trim()} fullWidth loading={saving} onClick={handleSave}>
              Сохранить
            </Button>
          </Stack>
        </div>
      </div>
    </div>
  )
}
