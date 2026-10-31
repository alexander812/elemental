import { createEffect } from 'effector'

import { clearAll } from '../../../lib/storage'
import type { BackupData, ImportMode } from '../../../transport/backup'
import { applyBackup, createBackup, downloadBackup } from '../../../transport/backup'

export const exportBackupFx = createEffect(
  async (
    selection:
      | string[]
      | {
          lessonIds: string[]
          readyCourseIds: string[]
        }
  ) => {
    const content = Array.isArray(selection)
      ? await createBackup(selection)
      : await createBackup(selection.lessonIds, selection.readyCourseIds)
    downloadBackup(content)
  }
)

export const importBackupFx = createEffect((payload: { backup: BackupData; mode: ImportMode }) =>
  applyBackup(payload.backup, payload.mode)
)

export const resetDataFx = createEffect(() => {
  clearAll()
  window.location.reload()
})
