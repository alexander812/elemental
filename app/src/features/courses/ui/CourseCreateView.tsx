import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'

import { IconEducation, IconSwapVert } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  EmptyScreen,
  FormHelperText,
  Header,
  InputText,
  Select,
  Stack,
  Text,
  Textarea,
} from '@elemental/ui-kit'

import {
  DEFAULT_ORIGINAL_LANG,
  DEFAULT_TRANSLATION_LANG,
  getLanguageName,
} from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import { $languages } from '../../languages/store'
import { goToLessons, popScreen } from '../../navigation/store'
import { courseSelected, createCourseFx, updateCourseFx, $courses } from '../store'

export function CourseCreateView({ courseId }: { courseId?: string }) {
  const courses = useUnit($courses)
  const languages = useUnit($languages)
  const createPending = useUnit(createCourseFx.pending)
  const updatePending = useUnit(updateCourseFx.pending)

  const course = useMemo(
    () => (courseId ? courses.find((item) => item.id === courseId) : undefined),
    [courses, courseId]
  )
  const isEditing = courseId !== undefined

  const [name, setName] = useState(course?.name ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [originalLang, setOriginalLang] = useState<LanguageCode>(
    course?.originalLang ?? DEFAULT_ORIGINAL_LANG
  )
  const [translationLang, setTranslationLang] = useState<LanguageCode>(
    course?.translationLang ?? DEFAULT_TRANSLATION_LANG
  )

  const options = useMemo(
    () => languages.map((language) => ({ label: language.name, value: language.code })),
    [languages]
  )
  const originalOptions = useMemo(
    () => options.map((option) => ({ ...option, disabled: option.value === translationLang })),
    [options, translationLang]
  )
  const translationOptions = useMemo(
    () => options.map((option) => ({ ...option, disabled: option.value === originalLang })),
    [options, originalLang]
  )

  const sameLanguages = originalLang === translationLang
  const canApply = name.trim().length > 0 && !sameLanguages
  const pending = createPending || updatePending

  const handleSwap = () => {
    setOriginalLang(translationLang)
    setTranslationLang(originalLang)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canApply) return

    if (isEditing && course) {
      await updateCourseFx({ courseId: course.id, name, description, originalLang, translationLang })
      popScreen()
      return
    }

    const { courseId: createdCourseId } = await createCourseFx({
      name,
      description,
      originalLang,
      translationLang,
    })

    courseSelected(createdCourseId)
    goToLessons()
  }

  if (isEditing && !course) {
    return (
      <Box grow height="100%">
        <Header back text="Изменить курс" onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Курс не найден" />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={isEditing ? 'Изменить курс' : 'Новый курс'}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <InputText
              autoFocus
              floatingLabel
              fullWidth
              placeholder="Название курса"
              size="m"
              value={name}
              onChange={setName}
            />

            <Textarea
              fullWidth
              placeholder="Описание курса"
              rows={3}
              value={description}
              onChange={setDescription}
            />

            <Card padding="l">
              <Stack spacing="m">
                <Stack spacing="xs">
                  <Text color="contrast-secondary" variant="XS / Medium">
                    Язык оригинала
                  </Text>
                  <Select
                    fullWidth
                    options={originalOptions}
                    value={originalLang}
                    onChange={(value) => setOriginalLang(value)}
                  />
                </Stack>
                <Button
                  fullWidth
                  startIcon={<IconSwapVert fontSize={24} />}
                  variant="secondary"
                  onClick={handleSwap}
                >
                  Поменять местами
                </Button>
                <Stack spacing="xs">
                  <Text color="contrast-secondary" variant="XS / Medium">
                    Язык перевода
                  </Text>
                  <Select
                    fullWidth
                    options={translationOptions}
                    value={translationLang}
                    onChange={(value) => setTranslationLang(value)}
                  />
                </Stack>
              </Stack>
            </Card>

            {sameLanguages ? (
              <FormHelperText variant="error">
                Языки оригинала и перевода должны различаться
              </FormHelperText>
            ) : null}

            <Text color="contrast-tertiary" variant="XS / Medium">
              {getLanguageName(originalLang, languages)} →{' '}
              {getLanguageName(translationLang, languages)} · наследуется уроками и заданиями курса
            </Text>

            <Button disabled={!canApply} fullWidth loading={pending} type="submit">
              {isEditing ? 'Сохранить' : 'Применить'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
