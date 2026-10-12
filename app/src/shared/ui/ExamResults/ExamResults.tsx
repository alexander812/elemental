import { Button, Stack, Text, TextPanel } from '@elemental/ui-kit'

type ExamResultsProps = {
  correctCount: number
  errorCount: number
  onBack: () => void
  onRetake: () => void
  passed: boolean
}

function ExamSmiley({ happy }: { happy: boolean }) {
  return (
    <svg aria-hidden="true" height={80} viewBox="0 0 80 80" width={80}>
      <circle cx="40" cy="40" fill="#ffcc4a" r="35" stroke="#050505" strokeWidth="7" />
      <circle cx="28" cy="33" fill="#050505" r="5" />
      <circle cx="52" cy="33" fill="#050505" r="5" />
      <path
        d={happy ? 'M24 48Q40 70 56 48' : 'M24 62Q40 44 56 62'}
        fill="none"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  )
}

export function ExamResults({
  correctCount,
  errorCount,
  onBack,
  onRetake,
  passed,
}: ExamResultsProps) {
  return (
    <Stack spacing="l" height="100%">
      <TextPanel grow>
        <Stack grow height="100%" horizontalAlign="center" spacing="l" verticalAlign="center">
          <ExamSmiley happy={passed} />
          <Stack spacing="s" width="100%">
            <Stack direction="row" horizontalAlign="space-between" spacing="m">
              <Text color="contrast-primary" variant="M / Medium">
                Правильных ответов
              </Text>
              <Text color="positive-text-and-icons" variant="M / Medium">
                {correctCount}
              </Text>
            </Stack>
            <Stack direction="row" horizontalAlign="space-between" spacing="m">
              <Text color="contrast-primary" variant="M / Medium">
                Ошибок
              </Text>
              <Text color="negative-text-and-icons" variant="M / Medium">
                {errorCount}
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </TextPanel>
      <Stack spacing="m">
        <Button fullWidth onClick={onRetake}>
          Пройти тест снова
        </Button>
        <Button fullWidth variant="secondary" onClick={onBack}>
          Вернуться к обучению
        </Button>
      </Stack>
    </Stack>
  )
}
