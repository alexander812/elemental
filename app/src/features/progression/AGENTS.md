# Прогресс (XP, монеты, уровни, квесты)

Фича мотивации: XP за действия, несгораемые/сгораемые XP с вехами по 500, уровни от несгораемых, монеты за квесты (заморозка/закрепление/восстановление XP), чип в шапке курсов и экран «Прогресс».

Файлы:
- `model/progression.ts` — типы событий (`ProgressionEvent`), дефолт, reducer (`applyProgressionEvents`: normalize → burnCheck → события → квесты), вехи/кристаллизация XP, цены (заморозка 50, закрепление max(30, XP/10), восстановление max(50, XP/5), авторские +10 XP до 3/день), `isProgression`.
- `model/quests.ts` — определения квестов (daily-пул, weekly-пул, сюжетная цепочка «Первый курс» по порядку, разовые discovery), награды монеты+XP, генерация дня/недели.
- `model/levels.ts` — `MILESTONE_XP = 500`, `GURU_XP = 3000`, имена уровней, `levelIndex`/`levelProgress`/`nextLevelThreshold` (Гуру — только 3000 несгораемых + завершённый курс).
- `model/dates.ts` — локальные день/неделя (`todayIso`, `isoWeekKey`, `daysBetween`).
- `model/completions.ts` — `buildCompletionEvents`: закрытие урока/курса по `$sets`/`$lessons`/`$courses` (критерий урока — все активные задания с пройденным тестом).
- `store/index.ts` — `$progression` (+save в `app.progression`), `fetchProgressionFx`, `queuedProgressionEvent` → `progressionEvent` (центральный гейт: загрузка прогресса + настройки + `Settings.progressionEnabled`), эмиттеры (`testCompleted`, `knowledgeOpened`), действия (`buyFreeze`, `buyPin`, `restoreBurn`, `dismissBurnNotice`, `dismissLevelUp`, `burnCheck`), производные (`$xpTotal`, `$level`, `$daysUntilBurn`, `$burnRisk`, `$freshBurn`, `$activeBurn`, `$pinCooldown`, `$levelUp`), подписка на события sets/course-search/theme. При включении настройки после выключения — событие `resumed` (свежее окно, старый burn сбрасывается).
- `ui/ProgressChip` — виджет прогресса (бейдж уровня + XP + монеты): в шапке «Курсы» справа, на экранах «Уроки», «Задания урока» и на карточках/тесте — по центру вместо названия (при выключенном прогрессе возвращается название); wink/flip иконок и догоняющие числа при поступлении, тревожный цвет при сгорании ≤1 дня; тап → экран `progress`.
- `ui/ProgressView` + `components/{LevelCard,BurningCard,QuestsCard,CertificatesCard}` — уровень и до следующего, несгораемые/сгораемые XP и дедлайн, кнопки заморозки/закрепления/восстановления, монеты, квесты (daily/weekly/сюжет/discovery), сертификаты, внизу — свитч «Прогресс и награды» (`Settings.progressionEnabled`).
- `ui/RewardIcon` — иконки наград из `public/icons/rewards/{xp,coin}.svg` (нарезаны из композиции Recraft: звезда «XP» и золотая монета).
- `ui/BurnNotice` — оверлей при сгорании (по $activeBurn, в AppLayout): сумма, восстановление за монеты, «ОК».
- `ui/LevelUpNotice` — оверлей нового уровня (салют + конфетти, автозакрытие 3.2 с).
- `ui/LevelBadge` — картинка уровня (`public/icons/levels/level-0..5.svg`, нарезаны из ряда Recraft; стрелки-пазы убраны, фон — своя скруглённая плитка).

Внешние связи: `lib/types.ts` (`Progression` и вложенные типы), `transport/progression.ts`, `features/sets/store` (`setCardLearnedFx`, `updateCardChecksFx`, `addCardsFx`, `createSetFx`, `$sets`), `features/courses|lessons` (`$courses`, `$lessons`), `features/course-search/store` (`loadCoursesFx`), `features/theme/store` (`setThemeFx`), `features/cards/ui/CardsView` (TestMode эмитит `testCompleted({ setId, errorless })`), `features/knowledge` (эмитит `knowledgeOpened`), `features/navigation/store` (экран `progress`), `layouts/AppLayout` (оверлеи, `burnCheck` на visibilitychange), `lib/sounds` (`playSalute`), `shared/ui/Confetti`.

Инварианты:
- Настройка `Settings.progressionEnabled` (по умолчанию включена, свитч на экране «Прогресс», пункт меню настроек «Прогресс»): при выключении виджет скрывается (в шапках возвращаются названия), награды не начисляются, сгорание не срабатывает; прогресс сохраняется. При включении — `resumed`: свежее окно, старый burn сбрасывается.
- Награды идемпотентны: id карточек/проверок/заданий/уроков/курсов хранятся в `rewarded`; `resetSet` право на награду не возвращает. Повторная загрузка курса из каталога создаёт новые id — награды слов можно получить заново (принято).
- XP: `xpLocked` всегда кратен 500; `xpBurning < 500`; сгорание — 2 полных пропущенных дня (`daysUntilBurn <= 0`), проверяется при загрузке, visibilitychange и любом событии; заморозка даёт +1 день (до 3), закрепление переводит сгораемые в несгораемые (кулдаун 2 дня), восстановление — в течение 24 ч после сгорания.
- Уровень считается только от несгораемых XP; «Гуру» требует завершённый курс (сертификат).
- Активный день = начислен XP (`markActive`); квесты закрываются автоматически при выполнении метрики (монеты + XP).
- Тексты — react-intl с английским `defaultMessage` (переводы по запросу); `app.progression` — отдельный ключ, `DATA_VERSION` не поднимался; в бэкап прогресс не входит (экспорт/импорт его не трогают).

Проверка: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run i18n -- --check`; e2e — Playwright-скрипты в temp (чип, экран «Прогресс», начисление XP, оверлеи).
