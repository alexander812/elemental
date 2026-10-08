import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'

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
  const userLang = useUnit($userLang)
  const createPending = useUnit(createCourseFx.pending)
  const updatePending = useUnit(updateCourseFx.pending)

  const course = useMemo(
    () => (courseId ? courses.find((item) => item.id === courseId) : undefined),
    [courses, courseId]
  )
  const isEditing = courseId !== undefined

  const [name, setName] = useState(course?.name ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [lang, setLang] = useState<LanguageCode>(course?.lang ?? DEFAULT_COURSE_LANG)

  const options = useMemo(
    () => languages.map((language) => ({ label: language.name, value: language.code })),
    [languages]
  )
  const langOptions = useMemo(
    () => options.map((option) => ({ ...option, disabled: option.value === userLang })),
    [options, userLang]
  )

  const sameLanguages = lang === userLang
  const canApply = name.trim().length > 0 && !sameLanguages
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
            <InputWithVoice
              autoFocus
              floatingLabel
              fullWidth
              lang={userLang}
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
              <Stack spacing="xs">
                <Text color="contrast-secondary" variant="XS / Medium">
                  Язык курса
                </Text>
                <Select
                  fullWidth
                  options={langOptions}
                  value={lang}
                  onChange={(value) => setLang(value)}
                />
              </Stack>
            </Card>

            {sameLanguages ? (
              <FormHelperText variant="error">
                Язык курса должен отличаться от вашего языка
              </FormHelperText>
            ) : null}

            <Text color="contrast-tertiary" variant="XS / Medium">
              {getLanguageName(userLang, languages)} → {getLanguageName(lang, languages)} ·
              наследуется уроками и заданиями курса
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
