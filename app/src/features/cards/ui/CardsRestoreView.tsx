import { useMemo, useState } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { IconEducation, IconRestore } from '@elemental/icons'
import { Box, Button, Card, Checkbox, EmptyScreen, Header, Stack } from '@elemental/ui-kit'

import { getCardText } from '../../../lib/cards'
import { getLanguageName } from '../../../lib/languages'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import { restoreCardsFx, $sets } from '../../sets/store'
import { $userLang } from '../../theme/store'

export function CardsRestoreView({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const pending = useUnit(restoreCardsFx.pending)

  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])
  const deletedCards = useMemo(() => set?.cards.filter((card) => card.deleted) ?? [], [set])

  const toggle = (cardId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)

      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }

      return next
    })
  }

  const handleRestore = () => {
    if (selected.size === 0) return

    restoreCardsFx({ setId, cardIds: [...selected] })
    popScreen()
  }

  if (!set) {
    return (
      <Box grow height="100%">
        <Header
          back
          text={<FormattedMessage id="cards_restore_title" defaultMessage="Restore deleted" />}
          onBackClick={() => popScreen()}
        />
        <EmptyScreen
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text={<FormattedMessage id="cards_set_not_found" defaultMessage="Set not found" />}
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="cards_restore_title" defaultMessage="Restore deleted" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        {deletedCards.length === 0 ? (
          <EmptyScreen
            fullHeight
            icon={<IconRestore fontSize={24} />}
            text={<FormattedMessage id="cards_restore_empty" defaultMessage="No deleted cards" />}
          />
        ) : (
          <Stack spacing="l" height="100%">
            <Card padding="m">
              <Stack spacing="l">
                {deletedCards.map((card) => {
                  const { lang, text } = getCardText(card, userLang)

                  return (
                    <Checkbox
                      key={card.id}
                      checked={selected.has(card.id)}
                      label={text}
                      subLabel={getLanguageName(lang, languages)}
                      onChange={() => toggle(card.id)}
                    />
                  )
                })}
              </Stack>
            </Card>
            <Button
              disabled={selected.size === 0}
              fullWidth
              loading={pending}
              onClick={handleRestore}
            >
              <FormattedMessage id="common_restore" defaultMessage="Restore" />
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  )
}
