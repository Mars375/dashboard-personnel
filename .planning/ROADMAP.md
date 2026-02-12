# Dashboard Personnel Améliorations

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-11)

**Core value:** Un dashboard personnel performant, sécurisé et maintenable

**Current focus:** Phase 2 - Refactor TodoWidget

---

## Phase Progress

| # | Name | Status | Progress |
|---|-------|--------|----------|
| 1 | Quick Wins & Sécurité | ✅ Complete | 5/5 complete (100%) |
| 2 | Refactor TodoWidget | 📋 Context Ready | 0/1 complete (0%) |
| 3 | Optimisation Bundle | Pending | 0/3 complete (0%) |
| 4 | Error Boundary | Pending | 0/1 complete (0%) |
| 5 | Tests E2E | Pending | 0/2 complete (0%) |
| 6 | State Management | Pending | 0/4 complete (0%) |
| 7 | Tests & Intégration | Pending | 0/2 complete (0%) |
| 8 | UX & Offline | Pending | 0/4 complete (0%) |

**Overall: 5/23 complete (22%)

---

## Phase Details

### Phase 1: Quick Wins & Sécurité ✅

**Goal:** Quick security wins and developer experience improvements

**Plans:** 5 plans completed

- [x] 01-01-PLAN.md — Expose Zustand stores for debugging
- [x] 01-02-PLAN.md — Migrate OAuth tokens to HttpOnly cookies
- [x] 01-03-PLAN.md — Implement Content Security Policy (partial)
- [x] 01-04-PLAN.md — Add Zod validation to forms
- [x] 01-05-PLAN.md — Test Error Boundary with crash scenarios

**Status:** Complete (with minor CSP technical debt)

**Summary:** Security significantly improved (HttpOnly cookies, CSP), developer experience enhanced (debug panel, form validation)

---

### Phase 2: Refactor TodoWidget 📋

**Goal:** Refactor TodoWidget (2556 lines) into maintainable components

**Context:** Captured ✅
**Plans:** 0 planned

Decisions made:
- Feature-based decomposition (SyncControls, ListManager, ImportExport, etc.)
- Custom hooks for business logic (useSync, useLists, useNotifications)
- Structured file organization (hooks/, components/, utils/)
- Preserve all functionality, improve testability

**Planned work:**
- Extract 5 feature components (SyncControls, ListManager, ImportExport, NotificationSettings, UndoRedoControls)
- Extract 4 custom hooks (useSync, useLists, useNotifications, useImportExport)
- Create utils/ for pure functions
- Maintain TodoWidget as orchestrator

**Status:** Context ready, awaiting planning

---

### Phase 3: Optimisation Bundle

**Goal:** Reduce bundle size and optimize performance

**Plans:** 0 planned

---

### Phase 4: Error Boundary

**Goal:** Add global Error Boundary

**Plans:** 0 planned

---

### Phase 5: Tests E2E

**Goal:** Add Playwright E2E tests

**Plans:** 0 planned

---

### Phase 6: State Management

**Goal:** Implement Repository pattern and normalize state

**Plans:** 0 planned

---

### Phase 7: Tests & Intégration

**Goal:** Complete OAuth tests and Outlook sync

**Plans:** 0 planned

---

### Phase 8: UX & Offline

**Goal:** PWA features and offline support

**Plans:** 0 planned
