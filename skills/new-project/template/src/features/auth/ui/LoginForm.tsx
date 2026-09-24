import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnit } from 'effector-react'
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
} from '@mantine/core'
import {
  loginFx,
  registerFx,
  $loginPending,
  $registerPending,
  $authError,
  resetAuthError,
} from '../store'

export function LoginForm() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')

  const loginPending = useUnit($loginPending)
  const registerPending = useUnit($registerPending)
  const authError = useUnit($authError)
  const pending = loginPending || registerPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'login') {
      await loginFx({ email, password })
      navigate('/')
    } else {
      await registerFx({ email, password, firstName })
    }
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    resetAuthError()
  }

  return (
    <Container size={420} py={80}>
      <Title ta="center" mb="xl">
        {mode === 'login' ? 'Войти' : 'Регистрация'}
      </Title>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <Stack>
          <form onSubmit={handleSubmit}>
            <Stack>
              {mode === 'register' && (
                <TextInput
                  label="Имя"
                  placeholder="Ваше имя"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              )}
              <TextInput
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <PasswordInput
                label="Пароль"
                placeholder="Ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {authError && (
                <Text c="red" size="sm">
                  {authError}
                </Text>
              )}
              <Button type="submit" loading={pending} fullWidth>
                {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </Stack>
          </form>

          <Text ta="center" size="sm">
            {mode === 'login' ? (
              <>
                Нет аккаунта?{' '}
                <Anchor onClick={() => switchMode('register')}>Зарегистрироваться</Anchor>
              </>
            ) : (
              <>
                Уже есть аккаунт? <Anchor onClick={() => switchMode('login')}>Войти</Anchor>
              </>
            )}
          </Text>
        </Stack>
      </Paper>
    </Container>
  )
}
