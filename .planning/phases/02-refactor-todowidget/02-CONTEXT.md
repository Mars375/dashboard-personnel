# Phase 2: Refactor TodoWidget - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor `src/widgets/Todo/TodoWidget.tsx` (currently 2556 lines) into maintainable, modular components while preserving all existing functionality.

**Scope:**
- Decompose monolithic component into focused, single-responsibility modules
- Extract business logic into testable units
- Improve code organization and maintainability
- Preserve all existing features (sync, lists, notifications, import/export, etc.)

**Out of scope:**
- No new features or UI changes
- No changes to TodoWidget external API (props, exports)
- No changes to data model or store structure
</domain>

<decisions>
## Implementation Decisions

### Component Decomposition Strategy

**Approach: Feature-based modules**
- Extract by responsibility/concern (Single Responsibility Principle)
- Create feature modules: Sync controls, List management, Import/Export, Notification settings, Undo/Redo controls
- Use container/presentational pattern where appropriate
- Keep UI components focused and "dumb" (receive props, emit callbacks)

**Granularity:**
- Coarse-grained extraction by feature (not fine-grained UI pieces)
- Each extracted component manages its own UI state (dialogs, form inputs)
- Business logic extracted to custom hooks, not embedded in components

**Specific extractions (planned):**
1. **SyncControls** - Manual sync button, sync status indicator, connection status
2. **ListManager** - List dropdown, create/rename/delete list dialogs
3. **ImportExport** - Import/export buttons, file input, JSON handling
4. **NotificationSettings** - Permission button, settings dialog
5. **UndoRedoControls** - Undo/redo buttons with disabled states
6. **useSync** hook - Google Tasks sync logic, syncing state management
7. **useLists** hook - List CRUD operations, current list management
8. **useNotifications** hook - Notification permission, settings, deadline checking
9. **useImportExport** hook - JSON import/export, validation

### State Management Approach

**Local state stays local:**
- Dialog open/close states (deleteDialogOpen, showNewList, etc.)
- Form input states (editingValue, newListName, etc.)
- Temporary UI states (isDragging, deadlinePickerOpen, etc.)

**Extracted concerns to custom hooks:**
- **useSync** - Google Tasks provider initialization, sync operations, syncingTodoIds
- **useLists** - List CRUD operations beyond what useTodos provides
- **useNotifications** - Notification permissions, settings, deadline checking logic
- **useImportExport** - File reading/writing, JSON validation

**Keep existing:**
- `useTodos` hook remains primary data source
- TodoStore remains single source of truth
- No new stores or context providers

### Code Organization & File Structure

**Create structured directories within `src/widgets/Todo/`:**

```
src/widgets/Todo/
├── TodoWidget.tsx (main container, orchestrates components)
├── components/
│   ├── index.ts (barrel exports)
│   ├── TodoAddForm.tsx (existing)
│   ├── TodoFilters.tsx (existing)
│   ├── TodoItem.tsx (existing)
│   ├── TodoSearchBar.tsx (existing)
│   ├── TodoStats.tsx (existing)
│   ├── SyncControls.tsx (new - sync button, status)
│   ├── ListManager.tsx (new - list CRUD UI)
│   ├── ImportExport.tsx (new - import/export buttons)
│   ├── NotificationSettings.tsx (new - permission, settings)
│   └── UndoRedoControls.tsx (new - undo/redo buttons)
├── hooks/
│   ├── index.ts (barrel exports)
│   ├── useSync.ts (new - sync logic)
│   ├── useLists.ts (new - list management)
│   ├── useNotifications.ts (new - notification logic)
│   └── useImportExport.ts (new - import/export logic)
├── utils/
│   ├── index.ts (barrel exports)
│   └── todoHelpers.ts (new - date formatting, validation)
└── types.ts (new - shared types if needed)
```

**File naming conventions:**
- Components: PascalCase (e.g., `SyncControls.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useSync.ts`)
- Utils: camelCase (e.g., `todoHelpers.ts`)

### Testing & Maintainability

**Export pure logic for testability:**
- Pure functions in `utils/todoHelpers.ts` (date formatting, validation) easily unit tested
- Custom hooks tested with `@testing-library/react-hooks`
- UI components tested with existing patterns (smoke tests)

**Component patterns:**
- Use React.memo() for extracted components to prevent unnecessary re-renders
- Callback functions wrapped in useCallback where passed to children
- Props interfaces explicitly typed

**No breaking changes:**
- TodoWidget exports same component type (WidgetProps)
- All existing functionality preserved
- Existing tests continue to pass

### Claude's Discretion

**Areas where I have flexibility during planning/implementation:**

- **Exact component split** - May adjust based on code complexity and dependencies
- **Hook composition** - May combine or split hooks differently based on shared logic
- **Helper function extraction** - Will extract reusable utilities as discovered during refactoring
- **Import optimization** - May adjust barrel exports (index.ts) structure
- **Type organization** - May create `types.ts` if shared interfaces emerge, or inline in component files

**User guidance:** Apply React best practices, prioritize maintainability and testability, keep changes minimal and focused.

</decisions>

<specifics>
## Specific Ideas

**Refactoring principles to follow:**
- "Boil down" approach: Start with large component, extract pieces until main component is a clean orchestrator
- Keep the component tree shallow (avoid deep nesting)
- Each file should be under 300 lines if possible
- Functions over 50 lines should be candidates for extraction

**Anti-patterns to avoid:**
- Premature optimization (don't memoize everything without profiling)
- Over-abstraction (don't create "framework" code, just extract what's needed)
- Context obsession (prop drilling is fine for 2-3 levels)

**Testing targets:**
- Extracted pure functions should have 100% coverage
- Custom hooks should have basic coverage (happy path, error cases)
- UI components should have smoke tests (render without crashing)

No specific references or "like X" requirements — focus on clean, standard React patterns.
</specifics>

<deferred>
## Deferred Ideas

**Ideas that came up but belong to other phases:**

- **Refactor CalendarWidget** (1672 lines) — Phase 3
- **Optimize bundle size** (framer-motion, recharts) — Phase 3
- **Lower virtualization threshold** (100 → 50 items for mobile) — Phase 2
- **Implement export/import for ALL widgets** (currently only Todo has this) — Future phase
- **Add undo/redo for other widgets** (currently only Todo has this) — Future phase
- **E2E tests for drag-drop** — Phase 5

Discussion stayed within TodoWidget refactoring scope.
</deferred>

---

*Phase: 02-refactor-todowidget*
*Context gathered: 2026-02-12*
