import { useEffect } from 'react'
import { Title, Paper, Text } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $home, $homeLoading, $homeError, fetchHomeFx } from '../store'

export function HomeView() {
  const data = useUnit($home)
  const loading = useUnit($homeLoading)
  const error = useUnit($homeError)

  useEffect(() => {
    fetchHomeFx()
  }, [])

  if (loading) return <Text c="dimmed">Загрузка…</Text>
  if (error) return <Text c="red">{error}</Text>

  return (
    <Paper withBorder p="lg">
      <Title>{data?.title}</Title>
    </Paper>
  )
}
