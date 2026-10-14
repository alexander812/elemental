# База знаний (видеоинструкции)

`videos.ts` — реестр `KNOWLEDGE_VIDEOS` (id, title, src mp4, webm-фолбэк, poster; пути от `BASE_URL`, файлы в `app/public/videos`) и константы id (`GENERAL_VIDEO_ID = 'overview'`, `TASK_VIDEO_ID = 'task'`). `ui/KnowledgeView/index.tsx` — список карточек и полноэкранный плеер на `BottomSheet fullHeight` (проп `videoId` открывает ролик сразу), `ui/KnowledgeView/components/VideoCard`.

Внешние связи: `features/navigation/store`, ui-kit (`BottomSheet`).

Скилл: `new-video` — движок скринкастов (`skills/new-video/engine`), сценарии (`skills/new-video/scenarios`), бэклог `SCENARIOS.md`; обязателен для съёмки и добавления роликов.

Инварианты: у каждого ролика — mp4 + webm + poster; новое видео добавляется в `KNOWLEDGE_VIDEOS` и в `app/public/videos`; `title` — `MessageDescriptor` (id + английский `defaultMessage`, переводы — по запросу в `lib/i18n/messages`, сами ролики на русском).
