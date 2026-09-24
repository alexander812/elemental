import { load, save, remove } from '../lib/storage'
import type { User, StoredUser } from '../lib/types'

export type UserPayload = User

const USERS_KEY = 'users'
const SESSION_KEY = 'session'

function readUsers(): StoredUser[] {
  return load<StoredUser[]>(USERS_KEY, [])
}

function toUser(stored: StoredUser): User {
  return {
    id: stored.id,
    email: stored.email,
    first_name: stored.first_name,
    last_name: stored.last_name,
  }
}

export async function login(email: string, password: string): Promise<User> {
  const user = readUsers().find((u) => u.email === email)
  if (!user || user.password !== password) {
    throw new Error('Неверный email или пароль')
  }
  save(SESSION_KEY, user.id)
  return toUser(user)
}

export async function register(email: string, password: string, firstName: string): Promise<void> {
  const users = readUsers()
  if (users.some((u) => u.email === email)) {
    throw new Error('Email already registered')
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    first_name: firstName,
    last_name: null,
    password,
  }
  save(USERS_KEY, [...users, user])
}

export async function logout(): Promise<void> {
  remove(SESSION_KEY)
}

export async function getMe(): Promise<User | null> {
  const id = load<string | null>(SESSION_KEY, null)
  if (!id) return null
  const user = readUsers().find((u) => u.id === id)
  return user ? toUser(user) : null
}
