import { createStore } from 'effector'

import { LANGUAGES_CATALOG } from '../../../lib/languages'

export const $languages = createStore(LANGUAGES_CATALOG)
