# Редактор текста и перевод слов

`ui/TextAddView.tsx` — селект языка, `Textarea` с предзаполнением, «Сканировать текст» (только Android через мост), «Сохранить» (`updateSetTextFx`/`draftTextSaved`). `ui/WordsTranslateView.tsx` — перевод слов задания.

Файлы: `store/index.ts` — `$text`, `$textLang`, `$words`, `$selected`, `$pairs`, `editStarted`, `segmentsLoaded`, `wordToggled`, `wordsMerged`, `selectionCleared`, `createCardsClicked`, `pairsReplaced`, `pairTranslated`, `translateAllFx`, `scanTextFx`, `restoreTextAdd`, `resetTextAdd`.

Внешние связи: `features/sets/store`, `features/set-create/store`, `features/theme/store`, `features/navigation/store`, `shared/ui/InputWithVoice`, `transport/ocr`, `transport/translate`, `lib/words.ts`, `lib/nativeBridge.ts`.

Оркестрация: субагент `sets-explorer`.

Инварианты: текст, выбор слов и язык живут в сторе и сохраняются в сессии — возврат назад их не теряет; сканирование доступно только при мосте.
