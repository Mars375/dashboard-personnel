# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
dashboard-personnel/
├── docs/                  # Documentation (MD files)
├── public/                # Static assets (favicon)
├── server/                # OAuth proxy server
│   ├── oauth-proxy.ts     # Express server for OAuth
│   └── start.ts           # Server entry point
├── src/                   # Main source code
│   ├── assets/            # Static assets (images, etc.)
│   ├── components/        # Shared UI components
│   │   ├── Dashboard/     # Dashboard-specific components
│   │   └── ui/            # shadcn/ui primitives
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and core logic
│   │   ├── api/           # API clients
│   │   ├── auth/          # OAuth authentication
│   │   ├── sync/          # Sync providers
│   │   └── widgetLibrary/ # External widget system
│   ├── pages/             # Page components (OAuth callback)
│   ├── store/             # Zustand stores and storage
│   ├── types/             # TypeScript type definitions
│   └── widgets/           # Widget modules (12 widgets)
├── tests/                 # Test files
│   ├── lib/               # Lib unit tests
│   ├── store/             # Store tests
│   ├── utils/             # Test utilities
│   └── widgets/           # Widget tests
├── index.html             # HTML entry point
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── vitest.config.ts       # Test configuration
├── tsconfig.json          # TypeScript configuration
└── vercel.json            # Vercel deployment config
```

## Directory Purposes

**`src/components/`:**
- Purpose: Reusable UI components
- Contains: shadcn/ui primitives, Dashboard components
- Key files: `ui/button.tsx`, `ui/card.tsx`, `Dashboard/Dashboard.tsx`

**`src/widgets/`:**
- Purpose: Self-contained feature modules
- Contains: 12 widget implementations with components
- Key files: `Todo/TodoWidget.tsx`, `Calendar/CalendarWidget.tsx`
- Structure: Each widget in own folder with `components/` subfolder

**`src/store/`:**
- Purpose: Zustand stores and localStorage persistence
- Contains: Store definitions and storage functions
- Key files: `dashboardStore.ts`, `todoStore.ts`, `todoStorage.ts`

**`src/lib/`:**
- Purpose: Core utilities and business logic
- Contains: Sync providers, auth, API clients, utilities
- Key files: `utils.ts`, `constants.ts`, `widgetRegistry.ts`

**`src/hooks/`:**
- Purpose: Custom React hooks for stateful logic
- Contains: Hooks for weather, todos, calendar, theme
- Key files: `useTodos.ts`, `useWeather.ts`, `useCalendar.ts`

**`tests/`:**
- Purpose: Test files mirroring src structure
- Contains: Unit tests, smoke tests, integration tests
- Key files: Mirror src structure under `lib/`, `store/`, `widgets/`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React root, error filtering
- `src/App.tsx`: App component with routing
- `server/oauth-proxy.ts`: OAuth server entry

**Configuration:**
- `vite.config.ts`: Build config with chunk splitting
- `vitest.config.ts`: Test runner config
- `tsconfig.json`: TypeScript base config
- `eslint.config.js`: Linting rules
- `components.json`: shadcn/ui config

**Core Logic:**
- `src/lib/widgetRegistry.ts`: Widget definitions and lazy loading
- `src/store/dashboardStore.ts`: Dashboard layout state
- `src/lib/auth/oauthManager.ts`: OAuth authentication
- `src/lib/sync/googleTasksSync.ts`: Google Tasks sync

**Testing:**
- `tests/utils/mockTypes.ts`: Type mocks
- `tests/utils/uiMocks.ts`: UI component mocks
- `tests/widgets/*/`: Widget-specific tests

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `TodoWidget.tsx`, `Button.tsx`)
- Utilities: camelCase (e.g., `utils.ts`, `logger.ts`)
- Stores: camelCase with Store/Storage suffix (e.g., `todoStore.ts`, `todoStorage.ts`)
- Tests: .test.tsx or .smoke.test.tsx suffix
- Types: camelCase or descriptive (e.g., `types.ts`, `shims.d.ts`)

**Directories:**
- Widgets: PascalCase matching widget name (e.g., `Todo/`, `Calendar/`)
- Components: PascalCase (e.g., `Dashboard/`, `ui/`)
- Features: lowercase (e.g., `auth/`, `sync/`, `api/`)

**Code:**
- Components: PascalCase (e.g., `TodoWidget`, `WeatherCard`)
- Functions: camelCase (e.g., `loadTodos`, `saveTodos`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `STORAGE_PREFIX`, `SYNC_INTERVALS`)
- Types: PascalCase with T prefix optional (e.g., `Todo`, `WidgetProps`)

## Where to Add New Code

**New Widget:**
1. Create folder: `src/widgets/{WidgetName}/`
2. Create component: `src/widgets/{WidgetName}/{WidgetName}Widget.tsx`
3. Register in: `src/lib/widgetRegistry.ts`
4. Add types in: `src/widgets/{WidgetName}/types.ts`
5. Add storage in: `src/store/{widgetName}Storage.ts`
6. Add tests in: `tests/widgets/{WidgetName}/`

**New UI Component:**
- Primitive: `src/components/ui/{component}.tsx` (use shadcn CLI)
- Feature-specific: `src/components/{feature}/{component}.tsx`

**New Hook:**
- Location: `src/hooks/use{Feature}.ts`
- Pattern: Export as `useFeature`

**New Sync Provider:**
1. Create: `src/lib/sync/{provider}Sync.ts`
2. Implement SyncProvider interface
3. Add to syncManager if needed

**New Store:**
- Location: `src/store/{feature}Store.ts`
- Pattern: Zustand create with persist middleware

**Utilities:**
- Shared helpers: `src/lib/utils.ts`
- Constants: `src/lib/constants.ts`

## Special Directories

**`docs/`:**
- Purpose: Project documentation
- Contains: README-style documentation files
- Generated: No
- Committed: Yes

**`public/`:**
- Purpose: Static assets served directly
- Contains: favicon.svg
- Generated: No
- Committed: Yes

**`server/`:**
- Purpose: OAuth proxy for secure token exchange
- Contains: Express server code
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-11*
