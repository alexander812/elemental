import { readTemporarySets, removeTemporarySet } from '../../../transport/temporary-sets'
import { CardsView } from '../../cards/ui/CardsView'
import { $nav, $stack, popScreen } from '../../navigation/store'
import { saveVocabularyPassedFx } from '../../sets/store'

$nav.updates.watch(({ stack, transition }) => {
  if (transition.kind === 'pop') return
  const active = new Set(
    stack.flatMap((screen) =>
      screen.name === 'vocabulary-cards' ? [screen.temporarySetId] : []
    )
  )
  for (const set of readTemporarySets()) if (!active.has(set.id)) removeTemporarySet(set.id)
})

export function VocabularyCardsView({
  setId,
  temporarySetId,
}: {
  setId: string
  temporarySetId: string
}) {
  return (
    <CardsView
      setId={temporarySetId}
      embedded
      onBack={() => popScreen()}
      onPassed={async () => {
        await saveVocabularyPassedFx({ setId, passed: true })
        const current = $stack.getState().at(-1)
        if (current?.name === 'vocabulary-cards' && current.temporarySetId === temporarySetId)
          popScreen()
      }}
    />
  )
}
