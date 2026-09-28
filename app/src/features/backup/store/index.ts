import { createEffect } from 'effector';

import type { BackupData } from '../../../transport/backup';
import { applyBackup, createBackup, downloadBackup } from '../../../transport/backup';

export const exportBackupFx = createEffect(async () => {
  const content = await createBackup();
  downloadBackup(content);
});

export const importBackupFx = createEffect((backup: BackupData) => applyBackup(backup));
