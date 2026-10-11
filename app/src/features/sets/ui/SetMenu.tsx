import { useState } from 'react'

import {
  IconEdit,
  IconMoreVertical,
  IconRefresh,
  IconRestore,
  IconSwapVert,
  IconTrash,
} from '@elemental/icons'
import { ButtonIcon, Menu } from '@elemental/ui-kit'

import { pushScreen } from '../../navigation/store'
import { setSetSwappedFx } from '../store'

type SetMenuProps = {
  onDeleteCards: () => void
  onDeleteSet: () => void
  onResetSet: () => void
  setId: string
  swapped: boolean
}

export function SetMenu({ onDeleteCards, onDeleteSet, onResetSet, setId, swapped }: SetMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Menu.Root open={menuOpen} onToggle={setMenuOpen}>
      <Menu.Trigger>
        <ButtonIcon ariaLabel="Меню" icon={<IconMoreVertical fontSize={24} />} variant="flat" />
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item
          icon={<IconEdit fontSize={16} />}
          label="Редактировать"
          onClick={() => pushScreen({ name: 'set-create', setId })}
        />
        <Menu.Item
          icon={<IconSwapVert fontSize={16} />}
          label="Поменять местами"
          onClick={() => setSetSwappedFx({ setId, swapped: !swapped })}
        />
        <Menu.Item
          icon={<IconTrash fontSize={16} />}
          label="Удалить все карточки"
          onClick={onDeleteCards}
        />
        <Menu.Item
          icon={<IconRestore fontSize={16} />}
          label="Восстановить удалённые"
          onClick={() => pushScreen({ name: 'cards-restore', setId })}
        />
        <Menu.Item icon={<IconRefresh fontSize={16} />} label="Сбросить" onClick={onResetSet} />
        <Menu.Item
          icon={<IconTrash fontSize={16} />}
          label="Удалить задание"
          onClick={onDeleteSet}
        />
      </Menu.Content>
    </Menu.Root>
  )
}
