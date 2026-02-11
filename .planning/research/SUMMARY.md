# Research Summary - Dashboard Personnel Améliorations

**Date:** 2026-02-11
**Source:** Codebase analysis + React ecosystem research

## Executive Summary

Dashboard React existant bien architecturé mais avec **3 axes critiques à améliorer**:
1. **Sécurité** - Tokens en localStorage (XSS vulnerable)
2. **Performance** - Widgets monolithiques (TodoWidget: 2556 lignes)
3. **Architecture** - Stores séparés sans relations cross-widgets

## Research Files Generated

- `.planning/research/STACK.md` - Analyse technique complète
- `.planning/research/PERFORMANCE.md` - Patterns de performance
- `.planning/research/STATE_MANAGEMENT.md` - State management patterns
- `.planning/research/SECURITY.md` - Sécurité OAuth

## Key Findings

### Stack Analysis (STACK.md)

**Garder (Confiance HIGH):**
- React 19.1 avec React Compiler
- TypeScript 5.9 strict
- Vite 7 + Rollup
- Tailwind CSS v4
- Zustand (amélioré)
- shadcn/ui (Radix)
- lucide-react
- Vitest + Testing Library

**Problème identifié:**
- ⚠️ framer-motion: 200KB gzipped (évaluer si nécessaire)
- ⚠️ recharts: 100KB gzipped (déjà lazy-loadé)

### Performance Analysis (PERFORMANCE.md)

**Gros widgets = Problème:**
- TodoWidget: 2556 lignes
- CalendarWidget: 1672 lignes
- Impact: Difficile à maintenir, tester, optimiser

**Solution recommandée:**
1. **Décomposition atomique** - Extraire sous-composants
2. **Virtualization** - `@tanstack/react-virtual` avec seuil 50-75 items
3. **Memo optimization** - `memo()`, `useMemo()`, `useCallback()`
4. **Animation alternatives** - CSS natives pour transitions simples

### State Management (STATE_MANAGEMENT.md)

**Actuel:**
- ⚠️ 12+ stores séparés
- ⚠️ Pas de relations cross-widgets
- ⚠️ localStorage direct (pas d'abstraction)

**3 approches:**
1. **Zustand unifié** (recommandé) - Un seul store avec slices
2. **Repository pattern** - Abstraction localStorage
3. **React-Query** - Overkill pour local-only

### Security (SECURITY.md)

**Vulnérabilité CRITIQUE:**
- ❌ Tokens OAuth dans localStorage (XSS possible)
- ⚠️ Pas de CSP
- ⚠️ Pas de validation input (Zod disponible mais pas utilisé)

**Solution prioritaire:**
1. **HttpOnly cookies** via proxy Express
2. **CSP headers** pour bloquer scripts malveillants
3. **Input sanitization** avec Zod

## Recommendations by Priority

### 🔴 CRITICAL (Fix immédiatement)

**SEC-01: Stocker tokens en HttpOnly cookies**
- Pourquoi: XSS vulnérabilité
- Comment: `server/oauth-proxy.ts` existe, à étendre
- Fichiers: `server/tokenManager.ts`, `server/oauth-proxy.ts`, `src/lib/auth/proxyAuth.ts`

**PERF-04: Virtualisation agressive**
- Pourquoi: Performance mobile
- Comment: Baisser seuil de 100 à 50-75 items
- Fichiers: `src/lib/constants.ts`, hooks à mettre à jour

### 🟠 HIGH (Prochaine phase)

**PERF-01: Découper TodoWidget**
- Pourquoi: 2556 lignes = cauchemar
- Comment: Extraire sous-composants dans `src/widgets/Todo/components/`
- Fichiers: `TodoList.tsx`, `TodoItem.tsx`, `TodoFilters.tsx`, `TodoStats.tsx`

**PERF-02: Découper CalendarWidget**
- Pourquoi: 1672 lignes = trop gros
- Comment: Extraire sous-composants dans `src/widgets/Calendar/components/`

**ARCH-01: Error Boundary global**
- Pourquoi: Empêche crash complet de l'app
- Comment: `src/components/ErrorBoundary.tsx`
- Fichiers: `App.tsx` wrappé dans ErrorBoundary

**TEST-01: Tests E2E avec Playwright**
- Pourquoi: Valider flows critiques
- Comment: Scénarios OAuth, drag-drop widgets
- Fichiers: `tests/e2e/` directory

### 🟡 MEDIUM (Planifier)

**SEC-02: Content Security Policy**
- Pourquoi: Bloquer XSS
- Comment: Headers dans `server/oauth-proxy.ts` + Vercel config
- Fichiers: `vercel.json`, `server/oauth-proxy.ts`

**SEC-03: Nettoyer tokens localStorage**
- Pourquoi: Migration propre
- Comment: Script one-time cleanup
- Fichiers: `src/lib/auth/tokenStorage.ts` migration

**PERF-03: Optimiser framer-motion**
- Pourquoi: 200KB pour animations simples
- Comment: Remplacer par CSS natives si possible
- Fichiers: Audit widgets utilisants Framer Motion

**ARCH-02: Repository pattern**
- Pourquoi: Abstraction data layer
- Comment: `src/lib/storage/BaseRepository.ts`
- Fichiers: Nouveau pattern à implémenter

**ARCH-03: State management unifié**
- Pourquoi: Relations cross-widgets
- Comment: `src/store/appStore.ts` avec slices
- Fichiers: Réfact de stores existants

### 🔵 LOW (Futur)

**UX-01: PWA + Service Worker**
- Pourquoi: Offline support
- Comment: `public/sw.js`, `manifest.json`
- Fichiers: Nouveaux fichiers PWA

**UX-02: Export/Import données**
- Pourquoi: Backup entre navigateurs
- Comment: `src/lib/exportImport.ts`
- Fichiers: Nouvelle fonctionnalité

## Quality Gates Status

| Category | Verifié? | Notes |
|----------|-----------|-------|
| Stack versions | ✅ | Versions actuelles confirmées |
| Bundle analysis | ⚠️ | À valider avec build:analyze |
| Security audit | ✅ | XSS et CSP identifiés |
| Performance metrics | ⚠️ | Web Vitals à implémenter |
| State patterns | ✅ | 3 approches comparées |

## Next Steps

**Pour la roadmap:**
1. Phase 1 se concentrera sur SÉCURITÉ et Error Boundary
2. Phase 2 se concentrera sur PERFORMANCE (refactor widgets)
3. Phase 3 se concentrera sur ARCHITECTURE (repository, state)
4. Phase 4 se concentrera sur TESTS et UX

**Dependencies:**
- SECURITY dépend de toutes phases (token storage critique)
- PERFORMANCE dépend de refactor (doit séparer state)
- TESTS dépend de composants séparés
- ARCHITECTURE dépend de stores stabilisés

**Risques identifiés:**
- Over-engineering state management (évaluer React-Query)
- Refactor trop agressif (casser la stabilité)
- Migration OAuth token storage (risque de régression)

---
*Research summary: 2026-02-11*
