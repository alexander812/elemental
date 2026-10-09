import { useUnit } from 'effector-react'

import { Card, Text } from '@elemental/ui-kit'

import { $toast } from './model'

import classes from './Toast.module.pcss'

export function Toast() {
  const message = useUnit($toast)

  if (!message) return null

  return (
    <div className={classes.host}>
      <Card borderColor="contrast-primary" color="surfaceElevation2" elevated padding="m">
        <Text align="center" variant="S / Medium">
          {message}
        </Text>
      </Card>
    </div>
  )
}
