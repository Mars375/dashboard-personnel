# Performance Research - Dashboard React

**Analysis Date:** 2026-02-11

## Problem Statement

Dashboard avec widgets lourds:
- **TodoWidget**: 2556 lignes (trop gros)
- **CalendarWidget**: 1672 lignes
- Issues: Re-renders, rendering lent, navigation lag

## Component Decomposition

### Current State
- ⚠️ Monolithic widgets - Tout dans un seul fichier
- ⚠️ Props drilling profond - Difficile de suivre
- ⚠️ Re-render cascade - Un state change = re-render widget entier
- Impact: Difficile à maintenir, tester, et optimiser

### Recommended Pattern: Atomic Components

**Découper en sous-composants:**

```typescript
// ❌ Éviter: Tout dans un fichier
function TodoWidget() {
  // 2556 lignes...
}

// ✅ Recommandé: Composé de composants ciblés
function TodoWidget() {
  return (
    <TodoLayout>
      <TodoHeader />
      <TodoListContainer>
        <TodoVirtualList>
          <TodoItem />
        </TodoVirtualList>
      </TodoListContainer>
      <TodoFilters />
      <TodoStats />
    </TodoLayout>
  );
}
```

**Bénéfices:**
- Re-render ciblé (seulement la partie qui change)
- Testabilité (chaque composant testable isolément)
- Tree-shaking (code mort supprimé)
- Performance (memo() efficace)

### Implementation Strategy

**Phase 1: Extraction horizontale**
1. Créer `components/` dans chaque widget
2. Extraire UI cards (TodoStats, TodoFilters)
3. Extraire items (TodoItem, CalendarDay)
4. Garder widget principal comme orchestrateur

**Phase 2: Virtualization**
1. Implémenter `@tanstack/react-virtual` (déjà installé)
2. Seuil: 50-75 items (pas 100)
3. Pagination pour grosses listes

**Phase 3: Memo optimization**
1. `memo()` sur composants purs (pas de hooks)
2. Comparaison custom pour objets complexes
3. `useMemo()` pour calculs coûteux (filtres, stats)

### Code Splitting

**État actuel:**
- ✅ Lazy loading widgets (via `widgetRegistry.ts`)
- ✅ Vendor chunks (react-vendor, ui-vendor, etc.)
- ⚠️ Missing: Route-based splitting

**Améliorations:**
```typescript
// ✅ Recommandé: Component lazy loading
const TodoStats = lazy(() => import("./components/TodoStats"));
const CalendarGrid = lazy(() => import("./calendar/Grid"));
```

### Animation Performance

**framer-motion - Analyse:**

**Problème:**
- 200KB gzipped pour animations simples
- Re-renders fréquents avec variants

**Solutions:**
```css
/* ✅ Solution 1: CSS natives - 0KB */
.todo-item {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.todo-item:hover {
  opacity: 1;
  transform: translateY(-2px);
}
```

```typescript
/* ✅ Solution 2: Auto-animate - 8KB (si nécessaire) */
import { motion } from "framer-motion";
// Utiliser seulement pour animations complexes (drag-drop, modales)
```

**Recommendation:**
1. Audit des animations framer-motion existantes
2. Remplacer par CSS natives si simples
3. Conserver Framer pour: drag-drop, modales, transitions complexes

## Bundle Optimization

### Current State

**Analyse via `pnpm build:analyze`:**
```
Chunk sizes (estimées):
react-vendor:    ~100KB (gzipped)
ui-vendor:        ~80KB (gzipped)
motion-vendor:    ~180KB (gzipped) ← CIBLE
charts-vendor:     ~60KB (gzipped)
```

### Optimization Strategies

**1. Tree Shaking**
```typescript
// ❌ Éviter
import { Button, Card, Dialog, ALL_COMPONENTS } from "@/components/ui";

// ✅ Faire
import { Button } from "@/components/ui/button"; // Tree-shakeable
```

**2. Dynamic Imports pour bibliothèques lourdes**
```typescript
// ✅ Déjà en place (chart-lazy.tsx)
const LazyPieChart = lazy(() => import("recharts").then(m => ({ default: m.PieChart })));
```

**3. PurgeCSS / Unused CSS**
```bash
# Detecter unused CSS
npx tailwindcss --help
# Configurer purge:vite dans tailwind.config.js
```

### Metrics à Suivre

**Web Vitals:**
```typescript
// src/lib/performanceMonitor.ts - À CRÉER
export function logWebVitals(metric: unknown) {
  // LCP, FID, CLS
  if (metric === "LCP" && value > 2500) console.warn("Slow LCP");
  if (metric === "FID" && value > 100) console.warn("Slow FID");
  if (metric === "CLS" && value > 0.1) console.warn("Layout shift");
}
```

**React DevTools Profiler:**
- Identifier render coûteux
- Chercher: "Why did this render?"
- Optimiser: `useMemo()`, `useCallback()`, `memo()`

## Virtualization Strategy

### Current Implementation

**Library:** `@tanstack/react-virtual` installé
**Usage:** Limité à 100+ items dans `constants.ts`

### Recommendations

```typescript
// ❌ Actuel
MAX_TODOS_WITHOUT_VIRTUALIZATION: 100

// ✅ Recommandé: Par taille de device
const VIRTUALIZATION_THRESHOLDS = {
  mobile: 50,    // 0-50 items
  tablet: 75,    // 50-75 items
  desktop: 100   // 75-100 items
};

// Détection dynamique
const threshold = VIRTUALIZATION_THRESHOLDS[deviceType];
```

### VirtualizedList Pattern

```typescript
// ✅ Composant optimisé
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualTodoList({ todos }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: todos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // hauteur moyenne item
    overscan: 5, // items buffer
  });

  return (
    <div ref={parentRef} style={{ height: `${virtualizer.getTotalSize()}px` }}>
      {virtualizer.getVirtualItems().map(virtualItem => (
        <TodoItem key={virtualItem.key} item={virtualItem.item} />
      ))}
    </div>
  );
}
```

## Performance Checklist

### Phase 1: Decomposition (Week 1-2)
- [ ] Découper TodoWidget en sous-composants
- [ ] Découper CalendarWidget en sous-composants
- [ ] Extraire composants réutilisables
- [ ] Ajouter `memo()` sur composants purs

### Phase 2: Virtualization (Week 2-3)
- [ ] Implémenter virtualization pour TodoList (50-75 items)
- [ ] Implémenter virtualization pour CalendarGrid
- [ ] Ajuster seuils dynamiques par device
- [ ] Tests performance avant/après

### Phase 3: Bundle Optimization (Week 3-4)
- [ ] Analyser bundle avec `pnpm build:analyze`
- [ ] Remplacer framer-motion par CSS (si possible)
- [ ] Conserver recharts lazy loadé
- [ ] Supprimer dépendances inutilisées

### Phase 4: Monitoring (Week 4)
- [ ] Implémenter Web Vitals tracking
- [ ] Ajouter React DevTools Profiler en dev
- [ ] Dashboard performance dans devtools
- [ ] Tests de performance (benchmarks)

## Anti-Patterns

❌ **Gross composants monolithiques** - Difficile à optimiser
❌ **Props drilling profond** - Utiliser Context ou stores
❌ **Re-renders inutiles** - `memo()`, `useMemo()`, `useCallback()`
❌ **Animations JS excessives** - CSS plus performant pour simples transitions
❌ **Lazy loading absent** - Tout charger au démarrage
❌ **Code splitting manuel** - Pas de séparation logique

---
*Performance research: 2026-02-11*
