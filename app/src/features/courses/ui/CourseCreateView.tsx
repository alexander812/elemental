import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { IconEducation } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  EmptyScreen,
  FormHelperText,
  Header,
  Select,
  Stack,
  Text,
  Textarea,
} from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $languages } from '../../languages/store'
import { goToLessons, popScreen } from '../../navigation/store'
import { $userLang } from '../../theme/store'
import { courseSelected, createCourseFx, updateCourseFx, $courses } from '../store'

export function CourseCreateView({ courseId }: { courseId?: string }) {
  const courses = useUnit($courses)
  const languages = useUnit($languages)
  const settingsUserLang = useUnit($userLang)
  const createPending = useUnit(createCourseFx.pending)
  const updatePending = useUnit(updateCourseFx.pending)

  const intl = useIntl()

  const course = useMemo(
    () => (courseId ? courses.find((item) => item.id === courseId) : undefined),
    [courses, courseId]
  )
  const isEditing = courseId !== undefined
  const courseUserLang = course?.userLang ?? settingsUserLang

  const [name, setName] = useState(course?.name ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [lang, setLang] = useState<LanguageCode>(course?.lang ?? DEFAULT_COURSE_LANG)

  const options = useMemo(
    () => languages.map((language) => ({ label: language.name, value: language.code })),
    [languages]
  )
  const langOptions = useMemo(
    () => options.map((option) => ({ ...option, disabled: option.value === settingsUserLang })),
    [options, settingsUserLang]
  )

  const langMismatch = !isEditing && lang === settingsUserLang
  const canApply = name.trim().length > 0 && !langMismatch
  const pending = createPending || updatePending

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canApply) return

    if (isEditing && course) {
      await updateCourseFx({ courseId: course.id, name, description, lang })
      popScreen()
      return
    }

    const { courseId: createdCourseId } = await createCourseFx({
      name,
      description,
      lang,
      userLang: settingsUserLang,
    })

    courseSelected(createdCourseId)
    goToLessons()
  }

  if (isEditing && !course) {
    return (
      <Box grow height="100%">
        <Header
          back
          text={<FormattedMessage id="course_create_edit" defaultMessage="Edit course" />}
          onBackClick={() => popScreen()}
        />
        <EmptyScreen
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text={<FormattedMessage id="course_create_not_found" defaultMessage="Course not found" />}
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={
          isEditing ? (
            <FormattedMessage id="course_create_edit" defaultMessage="Edit course" />
          ) : (
            <FormattedMessage id="course_create_new" defaultMessage="New course" />
          )
        }
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <InputWithVoice
              autoFocus
              floatingLabel
              fullWidth
              lang={courseUserLang}
              placeholder={
                <FormattedMessage
                  id="course_create_name_placeholder"
                  defaultMessage="Course name"
                />
              }
              size="m"
              value={name}
              onChange={setName}
            />

            <Textarea
              fullWidth
              placeholder={intl.formatMessage({
                id: 'course_create_description_placeholder',
                defaultMessage: 'Course description',
              })}
              rows={3}
              value={description}
              onChange={setDescription}
            />

            <Card padding="l">
              <Stack spacing="xs">
                <Text color="contrast-secondary" variant="XS / Medium">
                  <FormattedMessage id="course_create_lang" defaultMessage="Course language" />
                </Text>
                {isEditing ? (
                  <Text variant="M / Medium">{getLanguageName(lang, languages)}</Text>
                ) : (
                  <Select
                    fullWidth
                    options={langOptions}
                    value={lang}
                    onChange={(value) => setLang(value)}
                  />
                )}
              </Stack>
            </Card>

            {langMismatch ? (
              <FormHelperText variant="error">
                <FormattedMessage
                  id="course_create_lang_mismatch"
                  defaultMessage="Course language must be different from your language"
                />
              </FormHelperText>
            ) : null}

            <Text color="contrast-tertiary" variant="XS / Medium">
              <FormattedMessage
                id="course_create_inheritance"
                defaultMessage="{from} → {to} · inherited by the course's lessons and sets"
                values={{
                  from: getLanguageName(courseUserLang, languages),
                  to: getLanguageName(lang, languages),
                }}
              />
            </Text>

            <Button disabled={!canApply} fullWidth loading={pending} type="submit">
              {isEditing ? (
                <FormattedMessage id="common_save" defaultMessage="Save" />
              ) : (
                <FormattedMessage id="common_apply" defaultMessage="Apply" />
              )}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
