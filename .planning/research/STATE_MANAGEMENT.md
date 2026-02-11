# State Management Research - Dashboard Multi-Widgets

**Analysis Date:** 2026-02-11

## Current Architecture Analysis

**Zustand Stores Séparés:**
```typescript
// Actuel: Stores isolés sans relations
src/store/
├── todoStore.ts        // Todos uniquement
├── calendarStorage.ts    // Calendar uniquement
├── dashboardStore.ts     // Layout uniquement
├── weatherStorage.ts     // Weather uniquement
// ... 12+ stores indépendants
```

**Problèmes identifiés:**
1. **Pas de relations cross-widgets** - Impossible de lier tâche ↔ événement
2. **localStorage direct** - Pas d'abstraction, code dupliqué
3. **State dispersé** - Difficile de synchroniser
4. **Store logic dupliquée** - Même patterns répétés

## Recommended Patterns

### Option 1: Zustand Normalisé (Recommandé)

**Architecture:**
```typescript
// ✅ Recommandé: Unified store avec relations
interface AppState {
  todos: TodoState;
  calendar: CalendarState;
  // ...
  relations: {
    // tâche liée à événements
    todoLinkedEvents: Map<string, string[]>; // todoId → eventIds
  }
}

// Store principal avec sous-slices
export const useAppStore = create<AppState>()(
  devtools(/* nom: "Dashboard" */),
  persist({ name: "dashboard-app" })
);
```

**Avantages:**
- ✅ Un seul store à gérer
- ✅ Cross-widget relations possible
- ✅ DevTools centralisé
- ✅ Meilleure DX

### Option 2: Repository Pattern (Alternative)

**Data Layer Abstraction:**
```typescript
// ✌ Recommandé pour séparer localStorage du store
interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T>;
  save(item: T): Promise<void>;
  delete(id: string): Promise<void>;
  sync(provider: SyncProvider): Promise<T[]>;
}

// Implémentation
class TodoRepository implements IRepository<Todo> {
  async getAll(): Promise<Todo[]> {
    // Peut fetcher: localStorage, IndexedDB, API
    const data = await this.storage.get("todos");
    return JSON.parse(data) ?? [];
  }
}
```

**Avantages:**
- ✅ Testable (mock repository)
- ✅ Swap storage (localStorage → IndexedDB → Remote)
- ✅ Abstraction du sync

### Option 3: React-Query (Alternative Moderne)

**Server State + Cache:**
```typescript
// ✌ Pour sync avec backend futur
const {
  data: todos,
  isLoading,
  error,
  refetch,
} = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 1000 * 60 * 5, // 5 min
});

// Optimistic updates
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: (newTodo) => {
    // Update cache immédiatement
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
  },
});
```

**Avantages:**
- ✅ Cache automatique
- ✅ Background refetch
- ✅ Optimistic updates
- ⚠️ Overkill pour local-only (à évaluer)

## Implementation Strategy

### Phase 1: Normalisation (Week 1-2)

**Créer structure unifiée:**
```typescript
// src/store/appStore.ts
export const useAppStore = create<AppState>()((set, get) => ({
  // ... todos slice
  // ... calendar slice
  // ... dashboard slice
  
  // Relations cross-widgets
  linkTodoToEvent: (todoId, eventId) => set((state) => ({
    relations: {
      ...state.relations,
      todoLinkedEvents: {
        ...state.relations.todoLinkedEvents,
        [todoId]: [...(state.relations.todoLinkedEvents[todoId] ?? []), eventId]
      }
    }
  }))
}),})
```

**Migration path:**
1. Créer appStore unifié
2. Migrer todoStore progressivement
3. Créer adapters pour backward compat
4. Deprecier old stores graduellement

### Phase 2: Repository Pattern (Week 2-3)

**Abstraction localStorage:**
```typescript
// src/lib/storage/BaseRepository.ts
export abstract class BaseRepository<T> {
  constructor(protected storageKey: string) {}
  
  async getAll(): Promise<T[]> {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }
  
  async save(items: T[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}

// src/lib/storage/TodoRepository.ts
export class TodoRepository extends BaseRepository<Todo> {
  // Spécifique todos: sync, validation
}
```

### Phase 3: Cross-Widget Relations (Week 3-4)

**Cas d'usage: Tâche liée à événement**
```typescript
// Dans TodoWidget: créer → lier événement
const createEventLinkedTodo = (title: string, eventId: string) => {
  const todo = {
    id: generateId(),
    title,
    linkedEventId: eventId,
    // ...
  };
  addTodo(todo);
  linkTodoToEvent(todo.id, eventId); // Store relation
};

// Dans CalendarWidget: créer depuis tâche
const getEventLinkedTodos = (eventId: string) => {
  const relations = useAppStore(state => state.relations);
  return relations.todoLinkedEvents[eventId] ?? [];
};
```

## Comparison Table

| Approach | Complexity | Performance | DX | Cross-Widget Relations |
|----------|------------|-------------|-----|----------------------|
| **Actuel** (stores séparés) | LOW | HIGH | MEDIUM | ❌ Impossible |
| **Zustand Unifié** | MEDIUM | HIGH | HIGH | ✅ Possible |
| **Repository Pattern** | MEDIUM | HIGH | HIGH | ⚠️ Couche supplémentaire |
| **React-Query** | HIGH | HIGH | HIGH | ✅ Possible (+ server) |

## Recommendations

### Recommandation 1: Zustand Normalisé (START HERE)

**Pourquoi:**
- Maintient simplicité Zustand
- Résoud problèmes cross-widgets
- Améliore DX (un store, DevTools centralisé)
- Performance native (pas de surcouche)

**Implementation:**
```typescript
// src/store/appStore.ts
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// Slices
import { createTodosSlice } from "./slices/todoSlice";
import { createCalendarSlice } from "./slices/calendarSlice";
import { createDashboardSlice } from "./slices/dashboardSlice";

export const useAppStore = create<AppState>()(
  devtools({ name: "Dashboard" }),
  persist({ name: "dashboard-app", version: 1 }),
  (...createTodosSlice, ...createCalendarSlice, ...createDashboardSlice)
);
```

**Migration progressive:**
1. Créer appStore vide
2. Ajouter dashboard slice (priorité haute)
3. Migrer todoStore (todos + lists)
4. Continuer avec autres widgets

### Recommandation 2: Repository Pattern (NEXT STEP)

**Pourquoi:**
- Abstrait localStorage
- Prépare pour IndexedDB/WebSQL
- Testable (mock repositories)
- Sync providers plus simples

**Implementation:**
```typescript
// src/lib/storage/
├── BaseRepository.ts
├── TodoRepository.ts
├── CalendarRepository.ts
└── index.ts

// Utilisation dans stores
import { TodoRepository } from "@/lib/storage";

export const useTodoStore = create<TodoState>()((set, get) => ({
  addTodo: async (todo) => {
    const repo = new TodoRepository();
    await repo.save([...get().todos, todo]);
    set({ todos: await repo.getAll() });
  },
}));
```

## State Synchronization

### Sync Strategy

**Actuel:**
- ⚠️ Pas de sync entre widgets
- ⚠️ Chaque widget sync indépendamment

**Amélioré:**
```typescript
// Sync manager global
class SyncManager {
  syncAll() {
    const todos = await todoRepo.sync(googleTasks);
    const events = await calendarRepo.sync(googleCalendar);
    
    // Lier todos aux événements
    const relations = this.linkTodosToEvents(todos, events);
    await this.saveRelations(relations);
  }
}
```

## Implementation Checklist

### Phase 1: Analysis (Week 1)
- [ ] Cartographier tous les stores existants
- [ ] Identifier relations cross-widgets potentielles
- [ ] Auditor l'usage localStorage direct
- [ ] Documenter patterns actuels

### Phase 2: Unification (Week 2-3)
- [ ] Créer appStore unifié
- [ ] Implémenter slices pour chaque domaine
- [ ] Migrer todoStore vers appStore
- [ ] Maintenir backward compatibilité temporaire

### Phase 3: Repository Pattern (Week 3-4)
- [ ] Créer BaseRepository abstract
- [ ] Implémenter repositories concrètes
- [ ] Remplacer localStorage direct dans stores
- [ ] Tests repositories isolés

### Phase 4: Cross-Widget Relations (Week 4-5)
- [ ] Définir schéma de relations
- [ ] Implémenter sync entre widgets
- [ ] UI pour lier éléments
- [ ] Tests relations

## Anti-Patterns

❌ **Stores séparés isolés** - Difficile de synchroniser
❌ **localStorage direct partout** - Pas d'abstraction
❌ **Pas de relations** - Widgets silos
❌ **Logic dupliquée** - Même patterns répétés

---
*State management research: 2026-02-11*
