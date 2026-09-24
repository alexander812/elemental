export interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

export interface StoredUser extends User {
  password: string
}

export interface HomeData {
  title: string
}

export interface Response<Payload> {
  status: 'ok' | 'fail'
  payload?: Payload
  error?: string
}
