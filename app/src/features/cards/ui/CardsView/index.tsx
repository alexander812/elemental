import { useEffect, useMemo } from 'react'

import { useUnit } from 'effector-react'

import { IconEducation } from '@elemental/icons'
import { Box, EmptyScreen, Header, Spinner, Stack } from '@elemental/ui-kit'

import { popScreen } from '../../../navigation/store'
import { fetchSetsFx, $sets, $setsLoading } from '../../../sets/store'
import { LearnMode } from './components/LearnMode'

export function CardsView({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const setsLoading = useUnit($setsLoading)

  useEffect(() => {
    fetchSetsFx()
  }, [])

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])

  if (!set) {
    return (
      <Box grow height="100%">
        <Header back text="Задание" onBackClick={() => popScreen()} />
        {setsLoading ? (
          <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
            <Spinner size="l" />
          </Stack>
        ) : (
          <EmptyScreen
            fullHeight
            icon={<IconEducation fontSize={24} />}
            text="Задание не найдено"
          />
        )}
      </Box>
    )
  }

  return <LearnMode setId={setId} />
}
