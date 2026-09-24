import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnit } from 'effector-react'
import { AppShell, Group, Button, Text, Container } from '@mantine/core'
import { $user, logoutFx } from '../features/auth/store'

export function MainLayout({ children }: { children: ReactNode }) {
  const user = useUnit($user)
  const navigate = useNavigate()

  async function handleLogout() {
    await logoutFx()
    navigate('/login')
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Text fw={700} size="lg">
              New Project
            </Text>
            {user ? (
              <Group>
                <Text size="sm" c="dimmed">
                  {user.email}
                </Text>
                <Button variant="subtle" size="sm" onClick={handleLogout}>
                  Выйти
                </Button>
              </Group>
            ) : (
              <Button variant="subtle" size="sm" onClick={() => navigate('/login')}>
                Войти
              </Button>
            )}
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" py="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
