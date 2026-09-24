import { load } from '../lib/storage'
import type { HomeData } from '../lib/types'

export type { HomeData } from '../lib/types'

const HOME_KEY = 'home'

export async function fetchHomeData(): Promise<HomeData> {
  return load<HomeData>(HOME_KEY, { title: 'Hello' })
}
