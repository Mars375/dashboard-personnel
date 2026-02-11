# Roadmap - Dashboard Personnel Améliorations

**Created:** 2026-02-11
**Phases:** 8
**Requirements:** 23 v1 requirements mapped

---

## Phase 1: Quick Wins & Sécurité Critique

**Goal:** Livrer des améliorations rapides et résoudre la vulnérabilité XSS la plus critique

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| QOL-01 | 1 | Pending |
| QOL-02 | 1 | Pending |
| QOL-03 | 1 | Pending |
| SEC-01 | 1 | Pending |
| SEC-02 | 1 | Pending |
| SEC-03 | 1 | Pending |

**Success Criteria:**
1. Debug panel fonctionnel en mode développement (`window.__ZUSTAND_STORES__`)
2. Tokens OAuth stockés en HttpOnly cookies via proxy existant
3. Tokens invalides nettoyés du localStorage
4. Content Security Policy en place
5. Validation formulaires avec Zod activée

---

## Phase 2: Refactor Widget Todo

**Goal:** Découper TodoWidget (2556 lignes) en composants maintenables

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERF-01 | 2 | Pending |

**Success Criteria:**
1. `src/widgets/Todo/TodoWidget.tsx` réduit à ~300 lignes (orchestration)
2. `src/widgets/Todo/components/` créé avec:
   - `TodoList.tsx` (~300 lignes)
   - `TodoItem.tsx` (~200 lignes)
   - `TodoFilters.tsx` (~100 lignes)
   - `TodoStats.tsx` (~150 lignes)
   - `TodoAddForm.tsx` (~150 lignes)
3. Props typage améliorée (interface claire)
4. TodoWidget ne re-render pas inutilement

---

## Phase 3: Optimisation Bundle & Performance

**Goal:** Analyser et optimiser le bundle, améliorer performance globale

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERF-03 | 3 | Pending |
| PERF-04 | 3 | Pending |
| PERF-05 | 3 | Pending |

**Success Criteria:**
1. `pnpm build:analyze` exécuté et analysé
2. framer-motion remplacé par CSS natives (si possible) ou réduit
3. recharts lazy-loadé déjà en place (chart-lazy.tsx)
4. Seuil de virtualization baisser à 50-75 items (constants.ts)
5. Tree-shaking activé pour shadcn/ui

---

## Phase 4: Error Boundary Global

**Goal:** Empêcher le crash complet de l'application si un widget foire

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | 4 | Pending |

**Success Criteria:**
1. `src/components/ErrorBoundary.tsx` créé avec componentDidCatch
2. App.ts wrappé dans ErrorBoundary
3. Fallback UI composé pour erreurs React
4. Logger enregistre les erreurs
5. Crash widget isole n'affecte pas les autres widgets

---

## Phase 5: Tests E2E

**Goal:** Valider les flows critiques utilisateurs avec Playwright

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | 5 | Pending |

**Success Criteria:**
1. Playwright installé (`@playwright/test` package)
2. Tests OAuth flow créés (`tests/e2e/` directory)
3. Tests drag-drop widgets créés
4. Tests sync bidirectionnelle créés
5. `pnpm test --e2e` passe avec les nouveaux tests

---

## Phase 6: State Management Normalisé

**Goal:** Améliorer la gestion d'état pour cross-widgets et simplifier la maintenance

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-02 | 6 | Pending |
| ARCH-03 | 6 | Pending |
| ARCH-04 | 6 | Pending |

**Success Criteria:**
1. Repository pattern implémenté (`src/lib/storage/`)
2. appStore unifié avec slices (todos, calendar, etc.)
3. Relations cross-widgets définies (ex: todo ↔ event)
4. localStorage direct remplacé par repository calls
5. DevTools configuré pour appStore

---

## Phase 7: Tests & Intégration OAuth

**Goal:** Couvrir OAuth manquant et compléter sync Outlook

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-02 | 7 | Pending |
| SYNC-01 | 7 | Pending |

**Success Criteria:**
1. `src/lib/auth/oauthManager.ts` couvert par tests
2. Token refresh testé (expired session, race conditions)
3. Multiple providers testés simultanément
4. Outlook sync implémenté (`outlookSync.ts` sans TODOs)
5. `pnpm test` passe avec nouvelle couverture

---

## Phase 8: UX & Offline Support

**Goal:** Améliorer l'expérience utilisateur et supporter l'utilisation hors ligne

### Requirements Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| UX-01 | 8 | Pending |
| UX-02 | 8 | Pending |
| UX-03 | 8 | Pending |
| UX-04 | 8 | Pending |

**Success Criteria:**
1. Service Worker implémenté (`public/sw.js`)
2. Manifest PWA (`public/manifest.json`)
3. Export/Import fonctionnel (`src/lib/exportImport.ts`)
4. Toasts regroupés pour éviter spam
5. Loading states globaux (Suspense + skeletons)

---

## Phase Statistics

**Total Phases:** 8
**Total Requirements:** 23 v1 requirements
**Coverage:** 100% (all requirements mapped to phases)

### Breakdown by Category

| Category | Requirements | Phases |
|----------|------------|---------|
| Sécurité | 3 | 1 |
| Performance | 5 | 1, 2, 3 |
| Architecture | 4 | 4, 6 |
| Tests | 2 | 5, 7 |
| Sync | 2 | 7 |
| UX/DX | 4 | 8 |
| Quality | 3 | 1 |

### Estimated Timeline

| Phase | Duration | Complexity |
|-------|----------|------------|
| 1 (Quick Wins) | 1-2 weeks |
| 2 (Refactor) | 1-2 weeks |
| 3 (Performance) | 2-3 weeks |
| 4 (Error Boundary) | 1 week |
| 5 (E2E Tests) | 1-2 weeks |
| 6 (State) | 2-3 weeks |
| 7 (Tests OAuth) | 2-3 weeks |
| 8 (UX/PWA) | 3-4 weeks |

**Total Estimated:** 15-24 weeks

---

**Next:** Phase 1: Quick Wins & Sécurité

**Focus prioritaire:**
1. Sécurité critique (tokens HttpOnly)
2. Quick wins (debug panel, toasts, performance monitor)

**Quick Impact:**
- Sécurité XSS bloquée immédiatement
- DX améliorée pour développement futur

**Commencer par:** `/gsd-discuss-phase 1`

---
*Last updated: 2026-02-11*
