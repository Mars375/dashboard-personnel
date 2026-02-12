# AGENTS.md - Coding Agent Guide

This file provides essential context for AI coding agents working in this repository.

## Commands

### Development
```bash
pnpm dev              # Start Vite dev server (http://localhost:5173)
pnpm dev:server       # Start OAuth proxy server
pnpm dev:all          # Run both frontend and server
pnpm build            # TypeScript check + Vite build
pnpm preview          # Preview production build
```

### Linting
```bash
pnpm lint             # Run ESLint on all files
```

### Testing
```bash
pnpm test                           # Run all tests
pnpm test --watch                   # Watch mode
pnpm test --coverage                # With coverage report
pnpm test --ui                      # Visual UI mode

# Run a single test file
pnpm test tests/widgets/Todo/TodoWidget.smoke.test.tsx

# Run tests matching a pattern
pnpm test -t "renders without crashing"
pnpm test --filter="TodoWidget"
```

## Project Overview

Personal dashboard SPA with 12 customizable widgets (weather, todos, calendar, finance, etc.).
Built with React 19, TypeScript 5.9, Vite 7, Tailwind CSS v4, Zustand for state.

**Key Architecture:**
- Widget-based modular system with lazy loading
- Zustand stores with localStorage persistence
- OAuth integrations (Google, Microsoft, Notion) for external sync
- Custom sync providers for each external service

## Directory Structure

```
src/
├── components/       # Shared UI components (shadcn/ui in ui/)
├── widgets/          # 12 widget modules, each in own folder
├── store/            # Zustand stores (*Store.ts) and storage (*Storage.ts)
├── lib/              # Core utilities, sync providers, auth, API clients
├── hooks/            # Custom React hooks (useTodos, useWeather, etc.)
├── pages/            # Page components (OAuthCallback)
├── types/            # TypeScript type definitions

tests/                # Mirror of src/ structure
server/               # OAuth proxy (Express)
```

## Code Style

### Formatting
- Tabs for indentation
- Semicolons optional (follow existing file style)
- ESLint 9.x with flat config

### Naming Conventions
- **Files:** PascalCase for components (`TodoWidget.tsx`), camelCase for utilities (`utils.ts`)
- **Components:** PascalCase (`TodoWidget`, `CalendarCard`)
- **Functions/Variables:** camelCase (`loadTodos`, `saveTodos`)
- **Constants:** SCREAMING_SNAKE_CASE (`STORAGE_PREFIX`, `MAX_RETRIES`)
- **Types/Interfaces:** PascalCase (`Todo`, `WidgetProps`, `SyncConfig`)
- **Store files:** `*Store.ts` (e.g., `todoStore.ts`)
- **Storage files:** `*Storage.ts` (e.g., `todoStorage.ts`)
- **Test files:** `*.test.ts` or `*.smoke.test.tsx`

### Imports Order
```typescript
// 1. React
import { useState, useEffect, memo, useCallback } from "react";

// 2. Third-party libraries
import { create } from "zustand";
import { format } from "date-fns";

// 3. UI components (shadcn)
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 4. Local via @/ alias
import { useTodos } from "@/hooks/useTodos";
import { logger } from "@/lib/logger";

// 5. Relative imports
import { Todo } from "./types";
```

**Path alias:** `@/` maps to `./src/`

## TypeScript

- Strict mode enabled
- Explicit return types for public functions
- Type exports alongside value exports: `export function loadTodos(): Todo[]`
- Use `type` keyword for type-only imports: `import type { Todo } from "./types"`

## React Patterns

- **Function components only** - no class components
- **Hooks for state** - useState, useEffect, custom hooks
- **memo()** for expensive components: `const MemoComp = memo(function Comp() {})`
- **Custom hooks** encapsulate store access (e.g., `useTodos` wraps `useTodoStore`)

### Component Template
```typescript
import { useState, useEffect, memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/lib/widgetSize";

interface MyComponentProps extends WidgetProps {
  // props
}

export const MyComponent = memo(function MyComponent({ size }: MyComponentProps) {
  const [state, setState] = useState<string>("");

  useEffect(() => {
    // effect
  }, []);

  const handleClick = useCallback(() => {
    // handler
  }, []);

  return (
    <Card className={cn("p-4", size === "compact" && "p-2")}>
      {/* content */}
    </Card>
  );
});
```

## State Management (Zustand)

- **Stores** in `src/store/` - use `create` with `persist` middleware
- **Storage functions** handle localStorage directly
- **Hooks** wrap stores for component use

```typescript
// store/todoStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TodoState {
  todos: Todo[];
  addTodo: (todo: Todo) => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (todo) => set((s) => ({ todos: [...s.todos, todo] })),
    }),
    { name: "todos" }
  )
);
```

## Error Handling

- **localStorage:** Silent fallback on error
```typescript
try {
  return JSON.parse(localStorage.getItem(key)) ?? [];
} catch {
  return [];
}
```

- **User-facing:** Toast notifications via `sonner`
```typescript
import { toast } from "sonner";
toast.error("Something went wrong");
toast.success("Saved successfully");
```

- **Logging:** Use custom logger
```typescript
import { logger } from "@/lib/logger";
logger.debug("Message", data);
logger.error("Error:", error);
```

## Testing

- **Vitest** + **Testing Library**
- Heavy mocking for UI components (shadcn/ui)
- Smoke tests verify rendering without crashes

### Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>
}), { virtual: true });

vi.mock("@/hooks/useTodos", () => ({
  useTodos: () => ({ todos: [], addTodo: vi.fn() }),
}), { virtual: true });

beforeEach(() => {
  // localStorage mock, etc.
});

describe("MyComponent (smoke)", () => {
  it("renders without crashing", () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeTruthy();
  });
});
```

## Styling (Tailwind CSS v4)

- Use `cn()` utility for conditional classes:
```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-classes", condition && "conditional-class")} />
```

- Widget sizes: `"compact"` | `"medium"` | `"full"`
- Follow existing patterns for responsive design

## Comments

- Comments primarily in French (follow project language)
- JSDoc for public API functions
- Complex logic should have explanatory comments

## Key Files

- `src/lib/widgetRegistry.ts` - Widget definitions and lazy loading
- `src/store/dashboardStore.ts` - Dashboard layout state
- `src/lib/auth/oauthManager.ts` - OAuth authentication
- `src/lib/sync/googleTasksSync.ts` - Google Tasks sync pattern
- `vitest.config.ts` - Test configuration
- `eslint.config.js` - Linting rules
