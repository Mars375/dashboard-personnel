# Coding Conventions

**Analysis Date:** 2026-02-11

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `TodoWidget.tsx`, `Button.tsx`)
- Utility files: camelCase with `.ts` extension (e.g., `utils.ts`, `logger.ts`)
- Store files: camelCase with `Store.ts` suffix (e.g., `todoStore.ts`)
- Storage files: camelCase with `Storage.ts` suffix (e.g., `todoStorage.ts`)
- Type files: lowercase (e.g., `types.ts`) or `.d.ts` for declarations
- Test files: `{name}.test.ts` or `{name}.smoke.test.tsx`

**Functions:**
- camelCase for functions (e.g., `loadTodos`, `saveTodos`, `getOAuthManager`)
- Factory functions: `create{Thing}` (e.g., `createFromEnv`)
- Getters: `get{Thing}` (e.g., `getWidgetDefinition`)
- Loaders: `load{Thing}` (e.g., `loadTodos`)

**Variables:**
- camelCase for variables and properties
- SCREAMING_SNAKE_CASE for constants (e.g., `STORAGE_PREFIX`, `MAX_RETRIES`)
- Private class members: `private` keyword, no underscore prefix

**Types:**
- PascalCase for type and interface names (e.g., `Todo`, `WidgetProps`, `OAuthManager`)
- Type suffix optional for props: `WidgetProps`, `TodoFilter`
- Enum values: SCREAMING_SNAKE_CASE (e.g., `SYNC_INTERVALS.GOOGLE_TASKS`)

## Code Style

**Formatting:**
- Tool: ESLint with TypeScript config
- Prettier: Not configured (rely on ESLint)
- Indent: Tabs (detected in source)

**Linting:**
- Tool: ESLint 9.x with flat config
- Config: `eslint.config.js`
- Rules: TypeScript strict, React Hooks recommended, React Refresh
- Test files: `@typescript-eslint/no-explicit-any` disabled

**Key ESLint Rules:**
- TypeScript recommended rules
- React Hooks recommended-latest
- React Refresh for Vite HMR

## Import Organization

**Order:**
1. React imports (e.g., `import { useState, useEffect } from "react"`)
2. Third-party libraries (e.g., `import { create } from "zustand"`)
3. UI components (e.g., `import { Card } from "@/components/ui/card"`)
4. Local imports with `@/` alias (e.g., `import { useTodos } from "@/hooks/useTodos"`)
5. Relative imports (e.g., `import { Todo } from "./types"`)

**Path Aliases:**
- `@/` maps to `./src/`
- Configured in: `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`

**Example Import Block:**
```typescript
import { useState, useEffect, memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTodos } from "@/hooks/useTodos";
import { saveTodos, type Todo } from "@/store/todoStorage";
import { cn } from "@/lib/utils";
```

## Error Handling

**Patterns:**
- Custom `SyncError` class with error codes
- Try-catch with silent fallback for localStorage
- Error logging via custom logger
- User-facing errors via toast notifications (Sonner)

**Storage Error Pattern:**
```typescript
try {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  return JSON.parse(stored) as Todo[];
} catch {
  return []; // Silent fallback
}
```

**Sync Error Pattern:**
```typescript
try {
  const result = await api.call();
  return result;
} catch (error) {
  const syncError = SyncError.fromError(error);
  if (syncError.retryable && retries > 0) {
    return retryWithBackoff(fn, retries - 1);
  }
  throw syncError;
}
```

## Logging

**Framework:** Custom logger in `src/lib/logger.ts`

**Patterns:**
- `logger.debug()` for development info
- `logger.warn()` for non-critical issues
- `logger.error()` for failures
- Console-based with `[DEBUG]` prefix

**Usage:**
```typescript
import { logger } from "@/lib/logger";

logger.debug(`📦 Data loaded: ${items.length} items`);
logger.warn("Operation failed, using fallback:", error);
logger.error("Critical error:", error);
```

## Comments

**When to Comment:**
- Complex algorithms or business logic
- Workarounds for external issues
- API response format explanations
- Non-obvious type constraints

**JSDoc/TSDoc:**
- Used for public API functions
- Interface/type documentation
- Function parameter descriptions

**Example:**
```typescript
/**
 * Récupère un token d'accès valide (rafraîchit si nécessaire)
 */
async getValidAccessToken(provider: OAuthProvider): Promise<string>

/**
 * Formate une date en YYYY-MM-DD en local (évite les problèmes de timezone)
 */
export function formatDateLocal(date: Date): string
```

**French Comments:**
- Source comments primarily in French
- Reflects project origin/language preference

## Function Design

**Size:** Functions typically 10-50 lines, complex sync functions can be 100+ lines

**Parameters:**
- Use objects for multiple optional parameters
- Config objects for service instantiation
- Destructuring for clarity

**Return Values:**
- Explicit return types for public functions
- Async functions return Promise<T>
- Sync providers return SyncResult object

**Pattern:**
```typescript
// Config object pattern
interface GoogleTasksApiOptions {
  accessToken: string;
  retryWithBackoff?: <T>(fn: () => Promise<T>) => Promise<T>;
}

async function getTasks(
  taskListId: string,
  options: GoogleTasksApiOptions
): Promise<GoogleTask[]>
```

## Module Design

**Exports:**
- Named exports preferred
- Default export for main component/function per file
- Re-export types alongside functions

**Barrel Files:**
- Used sparingly
- `src/lib/auth/index.ts` re-exports auth types and functions

**Pattern:**
```typescript
// Named exports
export function loadTodos(listId: string): Todo[]
export function saveTodos(listId: string, todos: Todo[]): void
export type { Todo }

// Default export for main component
export default TodoWidget
export { TodoWidget } // Also named export
```

## React Patterns

**Component Style:**
- Function components only
- Hooks for state and effects
- `memo()` for performance optimization

**State Management:**
- Local state with `useState` for component-only state
- Zustand stores for shared/global state
- Custom hooks to encapsulate store access

**Effect Pattern:**
```typescript
useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  };
}, [dependencies]);
```

**Memo Pattern:**
```typescript
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Render
});

// With custom comparison
const MemoizedList = memo(ListComponent, (prev, next) => {
  return prev.items.length === next.items.length;
});
```

---

*Convention analysis: 2026-02-11*
