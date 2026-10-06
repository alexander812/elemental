import { combine } from 'effector'

import { $setsLoaded } from '../../sets/store'
import { $settingsLoaded } from '../../theme/store'

export const $appReady = combine(
  $setsLoaded,
  $settingsLoaded,
  (setsLoaded, settingsLoaded) => setsLoaded && settingsLoaded
)
