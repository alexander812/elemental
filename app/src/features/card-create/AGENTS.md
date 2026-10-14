# Создание и редактирование слова

`ui/CardCreateView.tsx` — два поля `InputWithVoice` (язык пользователя/курса) с автопереводом из парного поля и «Сохранить»; заголовок «Изменить слово» и `updateCardFx` при `cardId` в экране, иначе `addCardFx`. `store/index.ts` — `translateFx`.

Внешние связи: `features/sets/store` (карточки задания), `features/theme/store` (языки), `features/navigation/store`, `shared/ui/InputWithVoice`, `transport/translate`.

Оркестрация: фича входит в зону субагента `cards-explorer`; карта — в `../cards/AGENTS.md`.

Инварианты: тексты пишутся под языки пользователя/курса; автоперевод берёт текст из парного поля.
