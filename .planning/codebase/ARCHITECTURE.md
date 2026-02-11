# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** Modular Widget-Based SPA

**Key Characteristics:**
- Plugin architecture with widget registry
- Lazy-loaded widget components
- Zustand stores with localStorage persistence
- Sync providers for external services
- OAuth manager for authentication

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interaction
- Location: `src/components/`, `src/widgets/`
- Contains: React components, UI primitives, widgets
- Depends on: Store layer, Hooks layer
- Used by: App entry point

**State Management Layer:**
- Purpose: Application state and persistence
- Location: `src/store/`
- Contains: Zustand stores with persist middleware
- Depends on: Storage utilities
- Used by: Components, Hooks

**Business Logic Layer:**
- Purpose: Domain logic, sync, auth
- Location: `src/lib/`
- Contains: Utilities, sync managers, auth handlers
- Depends on: External APIs
- Used by: Stores, Hooks, Widgets

**Hook Layer:**
- Purpose: Encapsulated stateful logic
- Location: `src/hooks/`
- Contains: Custom React hooks
- Depends on: Store layer, Business logic layer
- Used by: Widgets

## Data Flow

**Widget Rendering Flow:**

1. `App.tsx` initializes WidgetProvider and Dashboard
2. Dashboard reads widget layouts from `useDashboardStore`
3. WidgetGrid maps layouts to WidgetItem components
4. WidgetItem lazily loads widget component from registry
5. Widget receives WidgetProps (size, context)

**State Flow:**

1. Component calls Zustand store action
2. Store updates state
3. Persist middleware syncs to localStorage
4. Components re-render with new state

**Sync Flow:**

1. User triggers sync action
2. Sync provider authenticates via OAuthManager
3. Provider fetches/pushes data to external API
4. Results merged into local store
5. UI reflects changes

**State Management:**
- Zustand with persist middleware for automatic localStorage sync
- Separate stores per domain (dashboard, todos, calendar, etc.)
- Undo/redo support in todoStore via temporal middleware

## Key Abstractions

**Widget:**
- Purpose: Self-contained UI module with specific functionality
- Examples: `src/widgets/Todo/TodoWidget.tsx`, `src/widgets/Calendar/CalendarWidget.tsx`
- Pattern: Receives WidgetProps, uses hooks for data, renders UI

**WidgetRegistry:**
- Purpose: Central registration of all available widgets
- Examples: `src/lib/widgetRegistry.ts`
- Pattern: Array of WidgetDefinition with lazy-loaded components

**SyncProvider:**
- Purpose: Interface for external service synchronization
- Examples: `src/lib/sync/googleTasksSync.ts`, `src/lib/sync/notionSync.ts`
- Pattern: Implements SyncProvider interface with pull/push methods

**Storage Functions:**
- Purpose: localStorage abstraction for each data type
- Examples: `src/store/todoStorage.ts`, `src/store/calendarStorage.ts`
- Pattern: load/save functions with typed data

## Entry Points

**Main Application:**
- Location: `src/main.tsx`
- Triggers: Browser loads index.html
- Responsibilities: React root, error filtering, StrictMode

**App Component:**
- Location: `src/App.tsx`
- Triggers: React render
- Responsibilities: Routing (OAuth vs Dashboard), WidgetProvider setup

**OAuth Callback:**
- Location: `src/pages/OAuthCallback.tsx`
- Triggers: OAuth redirect from provider
- Responsibilities: Token exchange, connection storage

**OAuth Proxy Server:**
- Location: `server/oauth-proxy.ts`
- Triggers: HTTP requests from client
- Responsibilities: Secure token exchange, CORS handling

## Error Handling

**Strategy:** Custom error classes with typed error codes

**Patterns:**
- `SyncError` class in `src/lib/errors.ts` with SyncErrorCode enum
- Retry with exponential backoff for network errors
- Toast notifications via Sonner for user feedback
- Logger utility for debugging

**Error Categories:**
```typescript
enum SyncErrorCode {
  NETWORK_ERROR,
  UNAUTHORIZED,
  NOT_FOUND,
  RATE_LIMITED,
  VALIDATION_ERROR,
}
```

## Cross-Cutting Concerns

**Logging:** Custom logger (`src/lib/logger.ts`) with DEBUG prefix, console-based

**Validation:** Zod schemas for runtime validation, TypeScript for compile-time

**Authentication:** OAuthManager singleton pattern, token refresh handling

**Performance:**
- Lazy loading for all widgets
- Virtualization for large lists (`@tanstack/react-virtual`)
- Memoization with React.memo and useMemo
- Bundle chunking by vendor in Vite config

**Theming:** next-themes with dark/light mode, CSS variables

---

*Architecture analysis: 2026-02-11*
