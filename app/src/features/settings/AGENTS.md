# Настройки

`ui/MenuView.tsx` — корневое меню (тема, язык, озвучка, распознавание, проверки, база знаний, поддержка, о приложении, данные). Экраны: `ThemeView.tsx`, `LanguageView.tsx`, `ChecksView.tsx` (свитчи «Распознавание речи», «Ручной ввод», «Переносить в выученные»), `SupportView.tsx` (кнопка с иконкой Telegram на бота `@lexi_support_bot`), `AboutView.tsx` (эмблема, версия и дата сборки, режим дебага).

Состояние — `features/theme/store`: `$settings`, `setThemeFx`, `setUserLangFx`, `setLearnAfterChecksFx`, `setVoiceCheckEnabledFx`, `setWriteCheckEnabledFx`, `setDebugModeFx`; модель — `Settings` в `lib/types.ts`, дефолты и persist — `transport/settings.ts`.

Внешние связи: `features/languages/store`, `features/navigation/store`, `lib/nativeBridge.ts` (пункты «Озвучка» и «Распознавание речи» — только в Android).

Скилл: `new-theme` — новая цветовая тема (токены `design-system/ui-kit/src/tokens`, `ThemeName`, boot-скрипт в `app/index.html`, Storybook, валидатор); `new-language` — язык интерфейса (локали в `app/src/lib/i18n/messages`, переводы, i18n-скрипт).

Инварианты: новая настройка — поле `Settings` с дефолтом в `DEFAULT_SETTINGS`; изменение модели данных требует поднять `DATA_VERSION` (см. корневой AGENTS.md); тексты экранов — сообщения react-intl (`defaultMessage` английский, переводы по запросу — см. PROJECT.md «Локализация интерфейса»).
