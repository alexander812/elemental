# Данные: экспорт, импорт, сброс

`ui/DataView.tsx` — экран «Данные» (экспорт, импорт, сброс), `ui/ExportView.tsx` — дерево курсов и уроков с чекбоксами. `store/index.ts` — `exportBackupFx`, `importBackupFx` (режимы `merge`/`replace`), `resetDataFx` (`clearAll()` + перезапуск).

Формат — `transport/backup.ts`: `BACKUP_VERSION` и `parseBackup` (читает только текущую версию), `createBackup`/`downloadBackup`.

Внешние связи: `lib/storage.ts`, `lib/types.ts`, `features/courses/store`, `features/lessons/store`, `features/navigation/store`, `shared/ui/ConfirmSheet`.

Инварианты: при изменении моделей данных (`lib/types.ts`, форматы `transport/*`) поднимаются `DATA_VERSION` (`lib/storage.ts` + литерал в `app/index.html`) и `BACKUP_VERSION`; старые данные и бэкапы не читаются («Не удалось прочитать файл»).
