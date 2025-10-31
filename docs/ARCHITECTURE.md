# 🏗️ Architecture du projet

## Vue d'ensemble

Le Dashboard Personnel suit une architecture modulaire avec séparation claire des responsabilités, facilitant la maintenance et l'extensibilité.

## Structure des répertoires

### `/src/components/ui`
Composants UI réutilisables basés sur **shadcn/ui** :
- Composants primitifs (Button, Card, Input, etc.)
- Composants complexes (Command, Dialog, DropdownMenu, etc.)
- Tous les composants sont accessibles et personnalisables

### `/src/hooks`
Hooks personnalisés React encapsulant la logique métier :

- **`useWeather.ts`** : Gestion des données météo
  - Fetching depuis OpenWeatherMap API
  - Cache et gestion d'erreurs
  - Prévisions 5 jours
  
- **`useAutocompleteCity.ts`** : Autocomplétion de villes
  - Debouncing des requêtes API
  - Navigation clavier
  - Gestion des suggestions
  
- **`useTodos.ts`** : Logique des tâches
  - Interface avec le store Zustand
  - Filtrage et recherche
  - Statistiques (compteurs)

### `/src/store`
Gestion d'état et persistance :

- **`todoStore.ts`** : Store Zustand principal
  - State management des todos
  - Historique pour undo/redo
  - Intégration avec localStorage
  
- **`todoStorage.ts`** : Persistance localStorage
  - Sauvegarde/chargement des todos
  - Support multi-listes
  
- **`todoLists.ts`** : Gestion des listes de todos
  - CRUD des listes
  - Liste courante
  
- **`weatherStorage.ts`** : Persistance météo
  - Dernière ville recherchée

### `/src/lib`
Utilitaires et intégrations :

- **`notifications.ts`** : Web Notifications API
  - Gestion des permissions
  - Rappels de deadlines
  
- **`sync/`** : Système de synchronisation
  - `apiSync.ts` : Interfaces communes
  - `syncManager.ts` : Orchestrateur
  - `notionSync.ts` : Provider Notion
  - `googleTasksSync.ts` : Provider Google Tasks
  
- **`utils.ts`** : Utilitaires généraux
  - Fonctions helper (cn, etc.)

### `/src/widgets`
Widgets autonomes du dashboard :

Chaque widget est indépendant et peut être utilisé séparément :
- **WeatherWidget** : Affichage météo
- **TodoWidget** : Gestion de tâches

## Patterns utilisés

### Custom Hooks Pattern
Encapsulation de la logique réutilisable :

```typescript
// Exemple : useWeather
const { data, loading, error, refresh } = useWeather("Paris");
```

### Provider Pattern
Pour les synchronisations API :

```typescript
class NotionSyncProvider implements SyncProvider {
  async sync(): Promise<SyncResult> { ... }
}
```

### Store Pattern (Zustand)
Gestion d'état global légère :

```typescript
const useTodoStore = create((set) => ({
  todos: [],
  addTodo: (todo) => set((state) => ({ ... })),
}));
```

## Flux de données

### Weather Widget
```
User Input → useAutocompleteCity → OpenWeatherMap API
                              ↓
                    useWeather Hook
                              ↓
                    WeatherWidget Display
                              ↓
                    weatherStorage (persistence)
```

### Todo Widget
```
User Action → TodoWidget → useTodos Hook
                              ↓
                    todoStore (Zustand)
                              ↓
                    todoStorage (localStorage)
                              ↓
                    TodoWidget Display (re-render)
```

## Gestion d'état

### Local State (useState)
Pour l'UI temporaire (modales, formulaires)

### Zustand Store
Pour l'état partagé des todos (liste, filtres, historique)

### localStorage
Pour la persistance côté client

## Sécurité

- Clés API stockées dans `.env.local` (non commitées)
- Validation des données utilisateur
- Gestion d'erreurs robuste
- Pas de données sensibles côté client

