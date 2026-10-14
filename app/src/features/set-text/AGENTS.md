# Текст задания

`ui/SetTextView/index.tsx` — экран `set-text{setId|draft}` и приветственный `set-intro` (режим `welcome`); панель слов — `components/WordsPanel`: табы языков (язык курса первым), выбор/объединение сегментов, «Очистить», кнопка edit → `text-add`, тултип перевода по удержанию 2 с, «Создать карточки» (`addCardsFx`), «Далее» в welcome.

Файлы: `store/index.ts` — `translateSegmentFx`, `translateSetTextFx`; разбор сегментов — `lib/words.ts` (`parseWords`, `parseSegmentParts`, `selectedWordTexts`, `mergeWordsInRange`).

Внешние связи: `features/text-add/store` (выбор слов и пары живут там), `features/set-create/store` (черновик), `features/sets/store`, `features/sets/ui/SetMenu`, `features/theme/store`, `features/navigation/store`, `shared/ui/ConfirmSheet`, `transport/translate`.

Оркестрация: субагент `sets-explorer`.

Инварианты: на табе языка пользователя слова заблокированы и «Создать карточки» недоступна; одинаковые тексты не дублируются; знаки пунктуации по краям слова не выделяются вместе с ним.
