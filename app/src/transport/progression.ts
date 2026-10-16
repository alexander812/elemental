import { load, save } from '../lib/storage'
import type { Progression } from '../lib/types'

const PROGRESSION_KEY = 'progression'

export async function fetchProgression(): Promise<Progression | null> {
  return load<Progression | null>(PROGRESSION_KEY, null)
}

export async function saveProgression(progression: Progression): Promise<void> {
  save<Progression>(PROGRESSION_KEY, progression)
}
