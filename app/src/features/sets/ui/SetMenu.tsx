import { useState } from 'react'

import { FormattedMessage, useIntl } from 'react-intl'

import {
  IconEdit,
  IconMoreVertical,
  IconPlusBig,
  IconRefresh,
  IconRestore,
  IconSwapVert,
  IconTrash,
} from '@elemental/icons'
import { ButtonIcon, Menu } from '@elemental/ui-kit'

import { pushScreen } from '../../navigation/store'
import { setSetSwappedFx } from '../store'

type SetMenuProps = {
  onAddCard?: () => void
  onDeleteCards: () => void
  onDeleteSet: () => void
  onResetSet: () => void
  setId: string
  swapped: boolean
}

export function SetMenu({
  onAddCard,
  onDeleteCards,
  onDeleteSet,
  onResetSet,
  setId,
  swapped,
}: SetMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const intl = useIntl()

  return (
    <Menu.Root open={menuOpen} onToggle={setMenuOpen}>
      <Menu.Trigger>
        <ButtonIcon
          ariaLabel={intl.formatMessage({ id: 'sets_menu', defaultMessage: 'Menu' })}
          icon={<IconMoreVertical fontSize={24} />}
          variant="flat"
        />
      </Menu.Trigger>
      <Menu.Content>
        {onAddCard ? (
          <Menu.Item
            icon={<IconPlusBig fontSize={16} />}
            label={<FormattedMessage id="sets_add_card" defaultMessage="Add card" />}
            onClick={onAddCard}
          />
        ) : null}
        <Menu.Item
          icon={<IconEdit fontSize={16} />}
          label={<FormattedMessage id="common_edit" defaultMessage="Edit" />}
          onClick={() => pushScreen({ name: 'set-create', setId })}
        />
        <Menu.Item
          icon={<IconSwapVert fontSize={16} />}
          label={<FormattedMessage id="sets_swap" defaultMessage="Swap" />}
          onClick={() => setSetSwappedFx({ setId, swapped: !swapped })}
        />
        <Menu.Item
          icon={<IconTrash fontSize={16} />}
          label={<FormattedMessage id="sets_delete_all_cards" defaultMessage="Delete all cards" />}
          onClick={onDeleteCards}
        />
        <Menu.Item
          icon={<IconRestore fontSize={16} />}
          label={
            <FormattedMessage id="sets_restore_cards" defaultMessage="Restore deleted cards" />
          }
          onClick={() => pushScreen({ name: 'cards-restore', setId })}
        />
        <Menu.Item
          icon={<IconRefresh fontSize={16} />}
          label={<FormattedMessage id="sets_reset_results" defaultMessage="Reset results" />}
          onClick={onResetSet}
        />
        <Menu.Item
          icon={<IconTrash fontSize={16} />}
          label={<FormattedMessage id="sets_delete_set" defaultMessage="Delete set" />}
          onClick={onDeleteSet}
        />
      </Menu.Content>
    </Menu.Root>
  )
}
