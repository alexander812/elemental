# Создание и редактирование задания

`ui/SetCreateView.tsx` — имя, `TextPanel` (тап → `set-text{draft}`), селект урока, пары `InputWithVoice` с автопереводом, «Перевести всё»; режим `setId` — заголовок «Изменить задание», предзаполнение и «Сохранить».

Файлы: `store/index.ts` — черновик: `draftInitialized`, `draftLessonChanged`, `draftNameChanged`, `draftPairChanged`, `draftPairAdded`, `draftWordsAdded`, `draftTextSaved`, `draftPairsTranslated`, `draftTextsRemapped`, `restoreDraft`, `draftReset`, `$draftLessonId`, `$draftName`, `$draftPairs`, `$draftTexts`, `translateFieldFx`, `translatePairsFx`.

Внешние связи: `features/sets/store` (`createSetFx`/`updateSetFx`), `features/lessons/store`, `features/theme/store`, `features/navigation/store`, `shared/ui/InputWithVoice`, `transport/translate`, `lib/cards.ts` (`remapTexts`), `lib/uid.ts`.

Оркестрация: субагент `sets-explorer`.

Инварианты: черновик живёт в сторе — возврат назад его не теряет; при переносе в урок другого курса тексты ремапятся; новые пары становятся новыми карточками.
