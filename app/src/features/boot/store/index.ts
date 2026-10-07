import { combine } from 'effector'

import { $coursesLoaded } from '../../courses/store'
import { $lessonsLoaded } from '../../lessons/store'
import { $setsLoaded } from '../../sets/store'
import { $settingsLoaded } from '../../theme/store'

export const $appReady = combine(
  $coursesLoaded,
  $lessonsLoaded,
  $setsLoaded,
  $settingsLoaded,
  (coursesLoaded, lessonsLoaded, setsLoaded, settingsLoaded) =>
    coursesLoaded && lessonsLoaded && setsLoaded && settingsLoaded
)
