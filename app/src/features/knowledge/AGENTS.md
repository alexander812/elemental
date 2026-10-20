# База знаний (видеоинструкции)

`videos.ts` — реестр `KNOWLEDGE_VIDEOS` (id, title, варианты `ru`/`en` с src mp4 и poster; пути от `BASE_URL`, файлы в `app/public/videos/<locale>`, выбор языка — `getKnowledgeVideoVariant`) и константы id (`GENERAL_VIDEO_ID = 'overview'`, `TASK_VIDEO_ID = 'task'`). `ui/KnowledgeView/index.tsx` — список карточек и полноэкранный плеер на `BottomSheet fullHeight` (проп `videoId` открывает ролик сразу), `ui/KnowledgeView/components/VideoCard`.

Внешние связи: `features/navigation/store`, ui-kit (`BottomSheet`).

Скилл: `new-video` — движок скринкастов (`skills/new-video/engine`), сценарии (`skills/new-video/scenarios`), бэклог `SCENARIOS.md`; обязателен для съёмки и добавления роликов.

Инварианты: у каждого ролика — mp4 + poster и варианты `ru`/`en`; файлы лежат в `app/public/videos/<locale>`; `ru`-интерфейс получает русские ролики, `en`/`es`/`fr` — английские (fallback `en`); `title` — `MessageDescriptor` (id + английский `defaultMessage`, переводы — по запросу в `lib/i18n/messages`).
