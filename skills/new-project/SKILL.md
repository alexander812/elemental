---
name: new-project
description: Создаёт новый фронтенд-проект по шаблону centaur-shop (React 19 + Vite + TypeScript + Mantine v9 + Effector). Транспортный слой абстрактный, данные по умолчанию в localStorage. Use when просят создать новый проект, шаблон, scaffold или скопировать структуру centaur-shop ("новый проект", "scaffold", "шаблон проекта", "new project").
---

# Новый проект по шаблону centaur-shop

Шаблоны лежат в `template/` рядом с этим файлом.

## Порядок действий

1. Уточни у пользователя: имя проекта и путь к каталогу. Если не указаны — спросить.
2. Создай каталог и скопируй шаблон (rsync копирует и dot-файлы):
   ```bash
   mkdir -p <target-dir> && rsync -a .opencode/skills/new-project/template/ <target-dir>/
   ```
3. Подставь имя проекта:
   - `package.json` → поле `name`
   - `index.html` → `<title>`
   - `src/layouts/MainLayout.tsx` → название в шапке (`New Project`)
4. В каталоге проекта: `npm install`
5. Проверка: `npm run lint` и `npm run build`. Оба должны проходить без ошибок.

## Структура проекта

```
src/
├── pages/              # точки входа — тонкие обёртки над фичами (HomePage.tsx)
├── layouts/
│   └── MainLayout.tsx  # AppShell: шапка + слот children
├── features/           # бизнес-логика по фичам
│   └── <feature>/
│       ├── store/index.ts   # Effector: *Fx, $stores
│       └── ui/              # компоненты фичи
├── transport/          # API-слой: чистые async-функции, Promise + payload
└── lib/
    ├── storage.ts      # доступ к localStorage (load/save/remove, префикс app.)
    ├── types.ts        # доменные типы
    └── utils.ts        # cn() и прочее
```

## Транспортный слой

- Каждый `transport/<feature>.ts` — чистые async-функции без Effector, возвращают `Promise<Данные>`.
- Источник данных выбирается внутри transport-файла, по умолчанию — локальное хранилище через `src/lib/storage.ts` (localStorage, JSON, префикс `app.`, ключи без префикса).
- В шаблоне так устроены `transport/auth.ts` (пользователи и сессия в localStorage) и `transport/home.ts`.
- Чтобы хранить данные фичи во внешнем бэкенде (CMS/API/другое хранилище): добавь клиент в `src/lib/` и замени источник только внутри нужного transport-файла. Store и UI не меняются — они знают только сигнатуры transport-функций.

## Паттерны Effector (обязательно соблюдать)

- **store** — `createEffect` оборачивает transport; `createStore` реагирует на `.doneData` / `.failData` / `.finally`.
- Loading-стор: `true` при запуске effect, `false` на `.finally`; error-стор сбрасывается `.reset(effect)`.
- **sample** — для цепочек (в шаблоне: регистрация → автологин в `features/auth/store`).
- Компоненты читают сторы только через `useUnit`; страницы — тонкие, логика в features.
- Пример паттерна: `src/features/home` (store + ui + `transport/home.ts`).

## Роутинг

- `src/App.tsx`: `checkAuthFx()` при загрузке, `/login` (если есть сессия — редирект на `/`), `PrivateRoute` для защищённых страниц.
- `features/auth/ui/UserGuard.tsx` — условный рендер только для авторизованных внутри публичных страниц.

## Стиль и код

- Prettier: без точек с запятой, singleQuote, printWidth 100 (`.prettierrc.json`).
- UI-компоненты — Mantine; shadcn/ui доступен через `components.json` (компоненты в `src/components/ui`, утилита `cn()` из `src/lib/utils.ts`).
- Алиас `@/` → `src/` (tsconfig + vite).
- ESLint flat config с prettier и react-hooks.

## После копирования

- В шаблоне нет данных: пользователи создаются через регистрацию в UI, локальные ключи появляются при первом обращении.
- Убедись, что в новом проекте нет лишних имён centaur (поиск: `centaur`, `Товары`, `Корзина`, `Заказы`).
