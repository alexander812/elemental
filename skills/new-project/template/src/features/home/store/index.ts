import { createStore, createEffect } from 'effector'
import * as homeApi from '../../../transport/home'
import type { HomeData } from '../../../transport/home'

// --- Effects ---

export const fetchHomeFx = createEffect(() => homeApi.fetchHomeData())

// --- Stores ---

export const $home = createStore<HomeData | null>(null).on(fetchHomeFx.doneData, (_, data) => data)

export const $homeLoading = createStore(false)
  .on(fetchHomeFx, () => true)
  .on(fetchHomeFx.finally, () => false)

export const $homeError = createStore<string | null>(null)
  .on(fetchHomeFx.failData, (_, err) => err.message)
  .reset(fetchHomeFx)
