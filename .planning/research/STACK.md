# Stack Research - Dashboard React 2025

**Analysis Date:** 2026-02-11

## Framework & Core

**React 19.1**
- ✅ Current version - Stable avec React Compiler optimisé
- ✅ Rationale: Performance native, Automatic Batching, Actions
- Confidence: HIGH
- Note: React 19 inclut React Compiler qui optimise automatiquement

**TypeScript 5.9**
- ✅ Current version - Strict mode enabled
- ✅ Rationale: Type safety, meilleurs messages d'erreur
- Confidence: HIGH
- Note: Conserver le strict mode

**Vite 7.1**
- ✅ Current version - Build tool moderne et rapide
- ✅ Rationale: HMR instantané, optimisations natifs
- Confidence: HIGH
- Alternative: Webpack (plus lent, plus complex)

**Bundler**
- ✅ Rollup (via Vite) - Tree-shaking automatique
- ✅ Rationale: Bundle minimal, code splitting optimisé
- Confidence: HIGH

## Performance & Optimizations

**Lazy Loading Widgets**
- ✅ Implemented: `lazy()` pour tous les widgets dans `src/lib/widgetRegistry.ts`
- ✅ Rationale: Réduit bundle initial, charge à la demande
- Confidence: HIGH
- Pattern: `const Widget = lazy(() => import("./Widget"))`

**Code Splitting**
- ✅ Implemented: manualChunks dans `vite.config.ts`
- ✅ Rationale: Cache séparé par vendor, mise à jour indépendante
- Confidence: HIGH
- Chunks: react-vendor, ui-vendor, motion-vendor, charts-vendor, date-vendor, icons-vendor, grid-vendor

**Virtualization**
- ⚡ Partial: `@tanstack/react-virtual` installé, usage limité à 100+ items
- ⚠️ Issue: Seuil de MAX_TODOS_WITHOUT_VIRTUALIZATION trop élevé (100)
- Recommendation: Baisser à 50-75 items pour mobile
- Confidence: MEDIUM

## UI & Styling

**Tailwind CSS v4**
- ✅ Current version - Dernière version majeure
- ✅ Rationale: Performance native (pas de runtime CSS), meilleures devtools
- Confidence: HIGH
- Note: Migration v3→v4 réussie

**shadcn/ui (Radix)**
- ✅ Current: Composants headless accessibles
- ✅ Rationale: Accessibilité, customization facile, maintenabilité
- Confidence: HIGH
- Note: Ne pas changer pour Material-UI ou autre

**Icons**
- ✅ lucide-react - 0.548.0
- ✅ Rationale: Consistent, tree-shakeable, icons optimisés
- Confidence: HIGH
- Note: Utiliser icônes Lucide existantes, pas de nouvelles librairies

## State Management

**Zustand 5.0**
- ✅ Current: State management principal
- ✅ Rationale: Simple, performant, boilerplate minimal, TypeScript natif
- Confidence: HIGH
- Middleware: `persist` pour localStorage
- Alternative: Redux Toolkit (sur-kill pour dashboard simple), Jotai (similaire)

**Current Pattern Issues:**
- ⚠️ Stores séparés sans relations cross-widgets
- ⚠️ localStorage direct (pas d'abstraction)
- Recommendation: Voir research STATE_MANAGEMENT.md

## Testing

**Vitest 4.0**
- ✅ Current: Test runner Vite-native
- ✅ Rationale: Plus rapide que Jest, ESM natif, meilleure intégration Vite
- Confidence: HIGH
- Watch mode: Oui avec --watch

**Testing Library 16.3**
- ✅ Current: Rendering components
- ✅ Rationale: Standards du domaine, queries réalistes
- Confidence: HIGH
- Note: 447 tests existants - bonne couverture

**Missing:**
- ❌ Tests E2E (Playwright ou Cypress)
- Recommendation: Ajouter pour flows critiques (OAuth, drag-drop)
- Priority: HIGH

## Security & Auth

**OAuth Implementé**
- ✅ Google: Tasks + Calendar fonctionnels via `googleAuth.ts`
- ✅ Notion: Sync basique via `notionAuth.ts`
- ⚠️ Microsoft: Outlook sync incomplet (`outlookSync.ts` avec TODOs)
- Confidence: MEDIUM

**Token Storage - CRITICAL ISSUE**
- ❌ Current: localStorage - vulnérable à XSS
- ✅ Recommended: HttpOnly cookies via proxy Express
- Implementation: `server/oauth-proxy.ts` déjà existe, à étendre
- Confidence: HIGH
- Priority: CRITICAL

**CSP**
- ❌ Missing: Pas de Content Security Policy
- ✅ Recommended: Ajouter meta tag CSP header
- Example: `default-src 'self'; script-src 'self' 'unsafe-inline';`
- Priority: HIGH

## Libraries to Evaluate

**framer-motion**
- ⚠️ Current: 12.23.24 - ~200KB gzipped
- ⚠️ Issue: Gros bundle pour animations simples
- ✅ Alternative 1: CSS transitions/animations natives
- ✅ Alternative 2: Auto-animate (plus léger)
- ✅ Alternative 3: Motion One (si animations riches nécessaires)
- Confidence: MEDIUM - Évaluer besoins réels

**recharts**
- ⚠️ Current: 2.15.4 - ~100KB gzipped
- ⚠️ Issue: Gros bundle pour widgets simples
- ✅ Alternative 1: Chart.js (plus léger mais moins features)
- ✅ Alternative 2: Victory (maintenu, moderne)
- ✅ Alternative 3: Conserver mais lazy load seulement
- Confidence: MEDIUM - Déjà lazy-loaded via chart-lazy.tsx

**react-grid-layout**
- ✅ Current: 1.5.2 - Grid drag-and-drop
- ✅ Rationale: Nécessaire pour dashboard, performant
- Confidence: HIGH
- Note: Garder, optimiser les re-renders

## Build & Deployment

**Vercel**
- ✅ Platform recommandé pour frontend
- ✅ Rationale: Gratuit, illimité, déploiement automatique
- Configuration: `vercel.json` présent
- Confidence: HIGH

**OAuth Proxy Server**
- ✅ Current: Express sur Railway/Render
- ✅ Rationale: Token storage HttpOnly, CORS handling
- File: `server/oauth-proxy.ts` (7913 bytes)
- Confidence: HIGH
- Improvement: Ajouter HttpOnly cookies, token refresh logic

## Recommendations Summary

### Keep As-Is (HIGH Confidence)
1. React 19 + TypeScript 5.9
2. Vite 7 + Rollup bundler
3. Tailwind CSS v4
4. Zustand (avec améliorations)
5. shadcn/ui (Radix)
6. lucide-react
7. Vitest + Testing Library
8. react-grid-layout

### Upgrade/Implement (HIGH Priority)
1. **Sécurité tokens** - HttpOnly cookies via proxy (CRITICAL)
2. **Tests E2E** - Playwright pour OAuth et drag-drop
3. **Virtualization** - Baisser seuil à 50-75 items
4. **Error Boundary** - Global pour éviter crash complet

### Evaluate/Replace (MEDIUM Priority)
1. **framer-motion** - CSS natives si animations simples
2. **recharts** - Conserver lazy load ou évaluer alternatives
3. **State management** - Ajouter relations ou normalisation

### DON'T Change (HIGH Confidence)
- Framework: React 19.1, Vite 7, TypeScript 5.9
- UI: shadcn/ui, Tailwind v4
- Icons: lucide-react
- Testing: Vitest

---
*Stack research: 2026-02-11*
