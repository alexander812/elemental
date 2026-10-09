import type { PropsWithChildren, ReactNode } from 'react'

import { BottomSheet, Box, Stack, Text } from '@elemental/ui-kit'

type ConfirmSheetProps = PropsWithChildren<{
  onClosed: () => void
  opened: boolean
  text: ReactNode
}>

export function ConfirmSheet({ children, onClosed, opened, text }: ConfirmSheetProps) {
  return (
    <BottomSheet opened={opened} onClosed={onClosed}>
      <Box padding="l">
        <Stack spacing="m" horizontalAlign="center">
          <Text align="center" variant="S / Medium">
            {text}
          </Text>
          {children}
        </Stack>
      </Box>
    </BottomSheet>
  )
}
