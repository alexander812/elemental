import { createStore, createEvent, createEffect, sample } from 'effector'
import * as authApi from '../../../transport/auth'
import type { UserPayload } from '../../../transport/auth'

// --- Effects ---

export const loginFx = createEffect(({ email, password }: { email: string; password: string }) =>
  authApi.login(email, password)
)

export const registerFx = createEffect(
  ({ email, password, firstName }: { email: string; password: string; firstName: string }) =>
    authApi.register(email, password, firstName)
)

export const logoutFx = createEffect(() => authApi.logout())

export const checkAuthFx = createEffect(() => authApi.getMe())

// --- Events ---

export const resetAuthError = createEvent()

// --- Stores ---

export const $user = createStore<UserPayload | null>(null)
  .on(loginFx.doneData, (_, user) => user)
  .on(checkAuthFx.doneData, (_, user) => user)
  .reset(logoutFx.done)

export const $authLoading = createStore(true).on(checkAuthFx.finally, () => false)

export const $loginPending = createStore(false)
  .on(loginFx, () => true)
  .on(loginFx.finally, () => false)

export const $registerPending = createStore(false)
  .on(registerFx, () => true)
  .on(registerFx.finally, () => false)

export const $authError = createStore<string | null>(null)
  .on(loginFx.failData, (_, err) => {
    const msg = err instanceof Error ? err.message : String(err)
    return `Ошибка входа: ${msg}`
  })
  .on(registerFx.failData, (_, err) => {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('already')) return 'Email уже занят'
    return `Ошибка регистрации: ${msg}`
  })
  .reset(loginFx, registerFx, resetAuthError)

// После успешной регистрации — автологин
sample({
  clock: registerFx.done,
  fn: ({ params }) => ({ email: params.email, password: params.password }),
  target: loginFx,
})
