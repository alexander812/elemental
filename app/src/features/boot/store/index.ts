import { combine } from 'effector'

import { $lessonsLoaded } from '../../lessons/store'
import { $setsLoaded } from '../../sets/store'
import { $settingsLoaded } from '../../theme/store'

export const $appReady = combine(
  $lessonsLoaded,
  $setsLoaded,
  $settingsLoaded,
  (lessonsLoaded, setsLoaded, settingsLoaded) => lessonsLoaded && setsLoaded && settingsLoaded
)
