# 🚀 Plan d'Optimisation - Roadmap

**Date de création** : 2025-01-XX  
**Status** : 📋 Planifié

---

## 🎯 Objectifs

### Métriques Cibles

- **Bundle initial** : < 300 KB (gzippé) - Actuellement ~350 KB
- **Temps de build** : < 10 secondes - Actuellement 13s ✅
- **Performance** : First Contentful Paint < 1s
- **Code coverage** : > 80%

---

## 📋 Optimisations Prioritaires

### Phase 1 : Bundle Size (Priorité Haute) 🔥

#### 1.1 Lazy Loading des Graphiques Recharts

**Branche** : `fix/optimisation-bundle-recharts`

**Problème** :

- `charts-vendor` : 369 KB (101.89 KB gzippé) - Le chunk le plus volumineux
- Recharts chargé même si pas de graphiques affichés

**Solution** :

- Lazy loading des composants Recharts
- Charger uniquement quand un widget avec graphique est visible
- Utiliser `React.lazy()` pour les imports de graphiques

**Impact attendu** : -369 KB du bundle initial (chargé à la demande)

**Fichiers à modifier** :

- `src/widgets/Todo/components/TodoStats.tsx`
- `src/lib/widgetRegistry.ts` (si nécessaire)

---

#### 1.2 Optimisation des Imports

**Branche** : `fix/optimisation-imports`

**Problème** :

- Imports potentiellement non optimisés
- Possibilité d'imports en masse

**Solution** :

- Vérifier tous les imports `lucide-react` (imports individuels ✅)
- Vérifier tous les imports `date-fns` (utiliser imports directs si possible)
- Tree-shaking plus agressif

**Impact attendu** : -10-20 KB du bundle

**Fichiers à vérifier** :

- Tous les fichiers avec imports de dépendances volumineuses

---

### Phase 2 : Performance (Priorité Haute) ⚡

#### 2.1 Memoization Supplémentaire

**Branche** : `fix/optimisation-performance-memoization`

**Problème** :

- Re-renders potentiellement inutiles
- Calculs coûteux répétés

**Solution** :

- Ajouter `React.memo()` aux composants lourds
- Utiliser `useMemo()` pour les calculs coûteux
- Utiliser `useCallback()` pour les fonctions passées en props

**Impact attendu** : Réduction des re-renders de 30-50%

**Composants à optimiser** :

- `WeatherWidget.tsx`
- `CalendarWidget.tsx`
- Composants de listes

---

#### 2.2 Virtualisation Supplémentaire

**Branche** : `fix/optimisation-performance-virtualisation`

**Problème** :

- Listes longues peuvent être lentes
- Virtualisation déjà en place pour TodoWidget ✅

**Solution** :

- Virtualiser les listes d'événements dans CalendarWidget (>50 événements)
- Virtualiser les suggestions de villes si nécessaire

**Impact attendu** : Performance améliorée pour listes > 100 items

**Fichiers à modifier** :

- `src/widgets/Calendar/CalendarWidget.tsx`

---

### Phase 3 : Refactoring (Priorité Moyenne) 🔧

#### 3.1 Refactoring calendar-full.tsx

**Branche** : `refactor/calendar-full`

**Problème** :

- Fichier volumineux : 1165 lignes
- Difficile à maintenir et tester

**Solution** :

- Extraire `CalendarGrid.tsx` - Grille du calendrier
- Extraire `CalendarHeader.tsx` - Header avec navigation
- Extraire `CalendarDay.tsx` - Cellule de jour
- Extraire `CalendarModifiers.tsx` - Logique des modifiers

**Objectif** : Réduire à ~400-500 lignes par fichier

**Impact attendu** : Meilleure maintenabilité et testabilité

---

#### 3.2 Refactoring googleTasksSync.ts

**Branche** : `refactor/google-tasks-sync`

**Problème** :

- Fichier volumineux : 1027 lignes
- Mélange de logique API, mapping et orchestration

**Solution** :

- Extraire `googleTasksApi.ts` - Appels API
- Extraire `googleTasksMapper.ts` - Mapping des données
- Extraire `googleTasksValidator.ts` - Validation (déjà fait ✅)
- Garder `googleTasksSync.ts` - Orchestration uniquement

**Objectif** : Réduire à ~300-400 lignes par fichier

**Impact attendu** : Meilleure séparation des responsabilités

---

### Phase 4 : Code Quality (Priorité Basse) ✨

#### 4.1 Supprimer les Types `any`

**Branche** : `fix/typescript-strict-types`

**Problème** :

- Types `any` restants dans le code
- Perte de sécurité de type

**Solution** :

- Identifier tous les `any`
- Remplacer par des types appropriés
- Utiliser des génériques si nécessaire

**Impact attendu** : Meilleure sécurité de type

---

#### 4.2 Améliorer la Gestion d'Erreurs

**Branche** : `fix/error-handling`

**Problème** :

- Gestion d'erreurs parfois incohérente
- Messages d'erreur peu clairs

**Solution** :

- Centraliser la gestion d'erreurs
- Utiliser le système SyncError existant ✅
- Améliorer les messages d'erreur

**Impact attendu** : Meilleure expérience utilisateur

---

## 📅 Planning Estimé

### Semaine 1 : Bundle Size

- [ ] `fix/optimisation-bundle-recharts` (2-3 jours)
- [ ] `fix/optimisation-imports` (1 jour)

### Semaine 2 : Performance

- [ ] `fix/optimisation-performance-memoization` (2-3 jours)
- [ ] `fix/optimisation-performance-virtualisation` (1-2 jours)

### Semaine 3-4 : Refactoring

- [ ] `refactor/calendar-full` (3-4 jours)
- [ ] `refactor/google-tasks-sync` (2-3 jours)

### Semaine 5 : Code Quality

- [ ] `fix/typescript-strict-types` (2-3 jours)
- [ ] `fix/error-handling` (1-2 jours)

**Total estimé** : 5 semaines (15-20 jours de travail)

---

## 🎯 Ordre d'Exécution Recommandé

### Sprint 1 : Impact Immédiat (Semaine 1-2)

1. ✅ Corrections TypeScript (fait)
2. 🔄 Lazy loading Recharts
3. 🔄 Memoization
4. 🔄 Optimisation imports

### Sprint 2 : Amélioration Continue (Semaine 3-4)

5. 🔄 Virtualisation supplémentaire
6. 🔄 Refactoring calendar-full
7. 🔄 Refactoring google-tasks-sync

### Sprint 3 : Qualité (Semaine 5)

8. 🔄 Types TypeScript stricts
9. 🔄 Gestion d'erreurs améliorée

---

## 📊 Métriques de Succès

### Avant Optimisations

- Bundle initial : ~350 KB (gzippé)
- Temps de build : 13s ✅
- Chunk le plus volumineux : 369 KB (charts-vendor)

### Après Optimisations (Objectifs)

- Bundle initial : < 300 KB (gzippé) (-14%)
- Temps de build : < 10s (-23%)
- Chunk le plus volumineux : < 200 KB (-46%)

---

## ✅ Checklist Générale

Pour chaque branche d'optimisation :

- [ ] Analyse du problème
- [ ] Solution proposée
- [ ] Implémentation
- [ ] Tests
- [ ] Mesure de l'impact (bundle size, performance)
- [ ] Documentation
- [ ] Code review
- [ ] Merge

---

---

## 📝 Guide d'Implémentation Détaillé

### 1.1 Lazy Loading Recharts - Guide Complet

#### Étape 1 : Analyse Actuelle

**Fichiers utilisant Recharts** :

- `src/widgets/Todo/components/TodoStats.tsx` - PieChart, Pie, Cell
- `src/components/ui/chart.tsx` - Import global de Recharts

**Bundle actuel** :

```bash
pnpm build:analyze
# Vérifier la taille de charts-vendor
```

#### Étape 2 : Créer un Wrapper Lazy

```typescript
// src/components/ui/chart-lazy.tsx
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loading des composants Recharts
const RechartsPieChart = lazy(() =>
  import("recharts").then(module => ({
    default: module.PieChart
  }))
);

const RechartsPie = lazy(() =>
  import("recharts").then(module => ({
    default: module.Pie
  }))
);

const RechartsCell = lazy(() =>
  import("recharts").then(module => ({
    default: module.Cell
  }))
);

// Wrapper avec Suspense
export function LazyPieChart({ children, ...props }: any) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <RechartsPieChart {...props}>
        {children}
      </RechartsPieChart>
    </Suspense>
  );
}

export function LazyPie({ ...props }: any) {
  return (
    <Suspense fallback={null}>
      <RechartsPie {...props} />
    </Suspense>
  );
}

export function LazyCell({ ...props }: any) {
  return (
    <Suspense fallback={null}>
      <RechartsCell {...props} />
    </Suspense>
  );
}
```

#### Étape 3 : Modifier TodoStats.tsx

```typescript
// Avant
import { PieChart as RechartsPieChart, Pie, Cell } from "recharts";

// Après
import { LazyPieChart, LazyPie, LazyCell } from "@/components/ui/chart-lazy";
```

#### Étape 4 : Vérifier l'Impact

```bash
# Avant
pnpm build
# Noter la taille de charts-vendor

# Après
pnpm build
# Vérifier que charts-vendor n'est plus dans le bundle initial
# Vérifier qu'un nouveau chunk est créé pour Recharts
```

**Métriques attendues** :

- Bundle initial : -369 KB
- Nouveau chunk Recharts : ~369 KB (chargé à la demande)
- First Contentful Paint : Amélioration de ~200-300ms

---

### 1.2 Optimisation des Imports - Guide Complet

#### Étape 1 : Audit des Imports

```bash
# Vérifier les imports date-fns
grep -r "from \"date-fns\"" src/

# Vérifier les imports lucide-react
grep -r "from \"lucide-react\"" src/

# Vérifier les imports en masse
grep -r "import \*" src/
```

#### Étape 2 : Optimiser date-fns

**Avant** :

```typescript
import { format, parseISO, addDays } from "date-fns";
```

**Après** (si possible) :

```typescript
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { addDays } from "date-fns/addDays";
```

**Note** : Vérifier que Vite/Tree-shaking gère déjà bien les imports

#### Étape 3 : Vérifier lucide-react

**Déjà optimisé** ✅ :

```typescript
import { Calendar, Clock } from "lucide-react";
```

**À éviter** :

```typescript
import * as Icons from "lucide-react"; // ❌
```

---

### 2.1 Memoization - Guide Complet

#### Étape 1 : Identifier les Composants à Mémoriser

**Critères** :

- Composants qui reçoivent des props qui changent souvent
- Composants avec des calculs coûteux
- Composants dans des listes

**Composants prioritaires** :

- `WeatherWidget.tsx` - Re-render quand météo change
- `CalendarWidget.tsx` - Re-render quand événements changent
- `TodoItem.tsx` - Déjà mémorisé ✅

#### Étape 2 : Implémenter React.memo()

```typescript
// Avant
export function WeatherWidget({ city, ...props }: WeatherWidgetProps) {
	// ...
}

// Après
export const WeatherWidget = memo(
	function WeatherWidget({ city, ...props }: WeatherWidgetProps) {
		// ...
	},
	(prevProps, nextProps) => {
		// Comparaison personnalisée si nécessaire
		return prevProps.city === nextProps.city;
	}
);
```

#### Étape 3 : Utiliser useMemo() pour les Calculs

```typescript
// Avant
const filteredEvents = events.filter((e) => e.date === selectedDate);

// Après
const filteredEvents = useMemo(
	() => events.filter((e) => e.date === selectedDate),
	[events, selectedDate]
);
```

#### Étape 4 : Utiliser useCallback() pour les Handlers

```typescript
// Avant
const handleClick = (id: string) => {
	// ...
};

// Après
const handleClick = useCallback(
	(id: string) => {
		// ...
	},
	[
		/* dépendances */
	]
);
```

---

### 2.2 Virtualisation - Guide Complet

#### Étape 1 : Identifier les Listes Longues

**Listes à virtualiser** :

- Événements dans CalendarWidget (>50 événements)
- Suggestions de villes dans WeatherWidget (>20 suggestions)

#### Étape 2 : Utiliser @tanstack/react-virtual

**Déjà implémenté pour TodoWidget** ✅

**Pattern à suivre** :

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
	count: items.length,
	getScrollElement: () => parentRef.current,
	estimateSize: () => 50, // Hauteur estimée
	overscan: 5, // Items supplémentaires à rendre
});
```

#### Étape 3 : Appliquer à CalendarWidget

```typescript
// Dans CalendarWidget.tsx
const eventsList = useMemo(
	() => getEventsForDate(selectedDate),
	[selectedDate, events]
);

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
	count: eventsList.length,
	getScrollElement: () => parentRef.current,
	estimateSize: () => 60,
	overscan: 3,
});
```

---

## 🔬 Métriques et Mesures

### Avant Optimisations

```bash
# Bundle size
pnpm build
# Total: ~1.2 MB (non-gzippé) | ~350 KB (gzippé)
# charts-vendor: 369 KB (101.89 KB gzippé)

# Performance
# First Contentful Paint: ~1.5s
# Time to Interactive: ~2.5s
# Bundle initial: 350 KB

# Build time
# 13.09 secondes
```

### Après Optimisations (Objectifs)

```bash
# Bundle size
# Total: ~850 KB (non-gzippé) | ~250 KB (gzippé) (-28%)
# charts-vendor: 0 KB (chargé à la demande)
# Nouveau chunk: ~369 KB (chargé uniquement si nécessaire)

# Performance
# First Contentful Paint: < 1s (-33%)
# Time to Interactive: < 1.5s (-40%)
# Bundle initial: < 250 KB (-28%)

# Build time
# < 10 secondes (-23%)
```

### Outils de Mesure

```bash
# Bundle analyzer
pnpm build:analyze

# Lighthouse
npx lighthouse http://localhost:5173 --view

# Web Vitals
# Utiliser Chrome DevTools > Performance
```

---

## 🧪 Tests de Performance

### Tests à Effectuer

#### 1. Bundle Size

```bash
# Avant
pnpm build
ls -lh dist/assets/js/

# Après
pnpm build
ls -lh dist/assets/js/
# Comparer les tailles
```

#### 2. Runtime Performance

```bash
# Utiliser React DevTools Profiler
# Mesurer les re-renders
# Vérifier les temps de rendu
```

#### 3. Network Performance

```bash
# Chrome DevTools > Network
# Vérifier le chargement initial
# Vérifier le chargement lazy
```

---

## 📊 Tableau de Suivi

| Optimisation               | Status | Impact Bundle | Impact Performance | Tests | Docs |
| -------------------------- | ------ | ------------- | ------------------ | ----- | ---- |
| Lazy loading Recharts      | 🔄     | -369 KB       | +200-300ms FCP     | ⏳    | ⏳   |
| Optimisation imports       | ⏳     | -10-20 KB     | +50-100ms FCP      | ⏳    | ⏳   |
| Memoization                | ⏳     | 0 KB          | -30-50% re-renders | ⏳    | ⏳   |
| Virtualisation             | ⏳     | 0 KB          | +50% perf listes   | ⏳    | ⏳   |
| Refactor calendar-full     | ⏳     | 0 KB          | Meilleure DX       | ⏳    | ⏳   |
| Refactor google-tasks-sync | ⏳     | 0 KB          | Meilleure DX       | ⏳    | ⏳   |

**Légende** :

- ✅ Terminé
- 🔄 En cours
- ⏳ À faire

---

## 🎯 Critères de Succès

### Bundle Size

- [ ] Bundle initial < 300 KB (gzippé)
- [ ] charts-vendor chargé à la demande
- [ ] Réduction globale de 20-30%

### Performance

- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 1.5s
- [ ] Réduction des re-renders de 30-50%

### Code Quality

- [ ] Tous les fichiers < 500 lignes
- [ ] Couverture de tests > 80%
- [ ] Pas de types `any` inutiles

### Build

- [ ] Temps de build < 10s
- [ ] Pas d'erreurs TypeScript
- [ ] Pas de warnings ESLint

---

**Note** : Ce plan est flexible et peut être ajusté selon les priorités et les résultats obtenus.
