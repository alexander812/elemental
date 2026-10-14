import { useState } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

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

import { DEFAULT_COURSE_LANG, DEFAULT_USER_LANG, getLanguageName } from '../../../lib/languages'
import { isNativeBridgeAvailable } from '../../../lib/nativeBridge'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import type { TextAddDraft } from '../../navigation/store'
import { draftTextSaved } from '../../set-create/store'
import { $courseLangByLesson, $sets, $userLangByLesson, updateSetTextFx } from '../../sets/store'
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
  const courseLangByLesson = useUnit($courseLangByLesson)
  const userLangByLesson = useUnit($userLangByLesson)
  const scanPending = useUnit(scanTextFx.pending)
  const scanFailed = useUnit($scanFailed)
  const saving = useUnit(updateSetTextFx.pending)
  const intl = useIntl()

  const set = setId ? sets.find((item) => item.id === setId) : undefined
  const courseLang =
    (set ? courseLangByLesson.get(set.lessonId) : undefined) ??
    draft?.courseLang ??
    DEFAULT_COURSE_LANG
  const courseUserLang =
    (set ? userLangByLesson.get(set.lessonId) : undefined) ?? draft?.userLang ?? DEFAULT_USER_LANG
  const lang = storedLang ?? courseLang
  const langOptions = [
    { label: getLanguageName(courseLang, languages), value: courseLang },
    { label: getLanguageName(courseUserLang, languages), value: courseUserLang },
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
        text={wasEditing ? <FormattedMessage id="text_add_edit_title" defaultMessage="Edit text" /> : <FormattedMessage id="text_add_add_title" defaultMessage="Add text" />}
        onBackClick={() => popScreen()}
      />
      <div className={classes.layout}>
        <div className={classes.inputScroll}>
          <Stack spacing="l">
            <Stack spacing="s">
              <Text color="contrast-secondary" variant="XS / Medium">
                <FormattedMessage id="text_add_text_lang" defaultMessage="Text language" />
              </Text>
              <Select fullWidth options={langOptions} value={lang} onChange={textLangChanged} />
            </Stack>
            <Textarea
              fullWidth
              placeholder={intl.formatMessage({ id: 'text_add_placeholder', defaultMessage: 'Type or paste the text' })}
              rows={6}
              value={text}
              onChange={textChanged}
            />
            {scanAvailable ? (
              <Button
                disabled={scanPending}
                fullWidth
                loading={scanPending}
                startIcon={<IconScan fontSize={24} />}
                variant="secondary"
                onClick={() => scanTextFx(lang)}
              >
                <FormattedMessage id="text_add_scan" defaultMessage="Scan text" />
              </Button>
            ) : null}
            {scanFailed ? (
              <FormHelperText variant="error"><FormattedMessage id="text_add_scan_failed" defaultMessage="Couldn't recognize the text" /></FormHelperText>
            ) : null}
            <Button disabled={!text.trim()} fullWidth loading={saving} onClick={handleSave}>
              <FormattedMessage id="common_save" defaultMessage="Save" />
            </Button>
          </Stack>
        </div>
      </div>
    </div>
  )
}
