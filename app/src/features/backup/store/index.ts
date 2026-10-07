import { createEffect } from 'effector'

import type { BackupData, ImportMode } from '../../../transport/backup'
import { applyBackup, createBackup, downloadBackup } from '../../../transport/backup'

export const exportBackupFx = createEffect(async (lessonIds: string[]) => {
  const content = await createBackup(lessonIds)
  downloadBackup(content)
})

export const importBackupFx = createEffect((payload: { backup: BackupData; mode: ImportMode }) =>
  applyBackup(payload.backup, payload.mode)
)
