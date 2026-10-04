import {
  IconArrowLeft,
  IconArrowRight,
  IconBack,
  IconCheck,
  IconChevronRight,
  IconClose,
  IconSettings,
  IconViewList,
} from '@elemental/icons'
import type { SupportedIconsMap } from '@elemental/ui-kit'

export const icons: SupportedIconsMap = {
  arrowDown: ({ size }) => (
    <IconChevronRight fontSize={size} style={{ transform: 'rotate(90deg)' }} />
  ),
  arrowLeft: ({ size }) => <IconArrowLeft fontSize={size} />,
  arrowRight: ({ size }) => <IconArrowRight fontSize={size} />,
  back: ({ size }) => <IconBack fontSize={size} />,
  check: ({ size }) => <IconCheck fontSize={size} />,
  close: ({ size }) => <IconClose fontSize={size} />,
  search: ({ size }) => <IconSettings fontSize={size} />,
  user: ({ size }) => <IconViewList fontSize={size} />,
}
