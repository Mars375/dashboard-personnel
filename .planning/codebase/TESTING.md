# Testing Patterns

**Analysis Date:** 2026-02-11

## Test Framework

**Runner:**
- Vitest 4.0.5
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in assertions (expect)
- @testing-library/jest-dom 6.9.1 for DOM matchers

**Run Commands:**
```bash
pnpm test              # Run all tests
pnpm test --watch      # Watch mode
pnpm test --coverage   # With coverage
pnpm test --ui         # UI mode
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root
- Mirrors `src/` structure

**Naming:**
- Unit tests: `{name}.test.ts`
- Component tests: `{name}.test.tsx`
- Smoke tests: `{name}.smoke.test.tsx`
- Feature tests: `{name}.{feature}.test.tsx`

**Structure:**
```
tests/
├── lib/                    # Lib unit tests
│   ├── sync/              # Sync provider tests
│   ├── store/             # Store tests
│   └── widgetLibrary/     # Widget library tests
├── store/                  # Storage tests
├── utils/                  # Test utilities
│   ├── mockTypes.ts       # Type mocks
│   └── uiMocks.ts         # UI component mocks
└── widgets/               # Widget tests
    ├── Todo/              # Todo widget tests
    ├── Calendar/          # Calendar widget tests
    └── Weather/           # Weather widget tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

describe("ComponentName (category)", () => {
  beforeEach(() => {
    // Setup
  });

  it("should do something specific", () => {
    // Test
  });

  it("handles edge case", () => {
    // Test
  });
});
```

**Patterns:**
- Setup: `beforeEach` for common mocks
- Teardown: Vitest auto-cleanup with `restoreMocks: true`
- Assertion: `expect()` with jest-dom matchers

## Mocking

**Framework:** Vitest `vi` utility

**Patterns:**

**UI Component Mocks:**
```typescript
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>
}), { virtual: true });

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>
}), { virtual: true });
```

**Hook Mocks:**
```typescript
vi.mock("@/hooks/useTodos", () => ({
  useTodos: () => ({
    todos: [{ id: "1", title: "Test task", completed: false }],
    addTodo: vi.fn(),
    toggleTodo: vi.fn(),
  }),
}), { virtual: true });
```

**localStorage Mock:**
```typescript
beforeEach(() => {
  const store: Record<string, string> = {};
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    store[key] = value;
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
    return store[key] ?? null;
  });
});
```

**Notification Mock:**
```typescript
beforeEach(() => {
  global.Notification = {
    permission: "granted",
    requestPermission: vi.fn().mockResolvedValue("granted"),
  } as any;
});
```

**What to Mock:**
- UI components (shadcn/ui)
- External libraries (framer-motion, recharts)
- Hooks (useTodos, useWeather)
- Browser APIs (localStorage, Notification)
- Sync managers

**What NOT to Mock:**
- Component under test
- Simple utility functions
- Type definitions

## Fixtures and Factories

**Test Data:**
```typescript
// Inline data in tests
const mockTodo: Todo = {
  id: "1",
  title: "Test task",
  completed: false,
  priority: false,
  createdAt: Date.now(),
};

// Mock return values
vi.mock("@/store/todoStorage", () => ({
  loadTodos: () => [mockTodo],
  saveTodos: vi.fn(),
}));
```

**Location:**
- Inline in test files
- Shared mocks in `tests/utils/mockTypes.ts`
- UI mocks in `tests/utils/uiMocks.ts`

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
pnpm test --coverage
```

**Coverage Scope:**
- 447 tests total (per README)
- Comprehensive widget coverage
- Unit tests for sync providers
- Store tests for state management

## Test Types

**Unit Tests:**
- Scope: Individual functions, hooks, stores
- Approach: Direct imports, mock dependencies
- Location: `tests/lib/`, `tests/store/`

**Component Tests (Smoke):**
- Scope: Widget rendering without errors
- Approach: Heavy mocking, shallow render
- Location: `tests/widgets/*/{Widget}.smoke.test.tsx`

**Integration Tests:**
- Scope: Widget interactions, sync flows
- Approach: Mock external APIs, test internal flow
- Location: `tests/lib/sync/`, `tests/widgets/*/`

**E2E Tests:**
- Not used in this project

## Common Patterns

**Smoke Test Pattern:**
```typescript
describe("WidgetName (smoke)", () => {
  it("renders without crashing", () => {
    const { container } = render(<WidgetName />);
    expect(container).toBeTruthy();
  });

  it("renders key elements", () => {
    render(<WidgetName />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
```

**Async Testing Pattern:**
```typescript
it("loads data asynchronously", async () => {
  render(<Component />);

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  // Verify loaded content
  expect(screen.getByText("Data loaded")).toBeInTheDocument();
});
```

**Error Testing Pattern:**
```typescript
it("handles API errors gracefully", async () => {
  vi.mocked(api.fetch).mockRejectedValue(new Error("Network error"));

  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

**User Interaction Pattern:**
```typescript
import userEvent from "@testing-library/user-event";

it("handles button click", async () => {
  const user = userEvent.setup();
  render(<Component />);

  await user.click(screen.getByRole("button", { name: /add/i }));

  expect(mockAddFn).toHaveBeenCalled();
});
```

---

*Testing analysis: 2026-02-11*
