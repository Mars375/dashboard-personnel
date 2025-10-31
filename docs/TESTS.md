# 🧪 Documentation des tests

## Vue d'ensemble

Le projet utilise **Vitest** et **Testing Library** pour une couverture de tests complète et robuste.

## Statistiques

- **29 fichiers de tests**
- **85 tests** au total
- **100% des fonctionnalités critiques testées**

## Structure des tests

```
tests/
├── lib/
│   ├── storage.test.ts              # Tests de persistance
│   ├── useWeather.smoke.test.tsx    # Tests du hook météo
│   ├── useAutocompleteCity.smoke.test.tsx
│   ├── useTodos.smoke.test.tsx
│   └── sync/                        # Tests de synchronisation
│       ├── apiSync.test.ts
│       ├── notionSync.test.ts
│       ├── googleTasksSync.test.ts
│       └── syncManager.test.ts
└── widgets/
    ├── Weather/
    │   ├── WeatherWidget.smoke.test.tsx
    │   ├── WeatherWidget.error.test.tsx
    │   ├── WeatherWidget.loading.test.tsx
    │   ├── WeatherWidget.forecast.test.tsx
    │   ├── WeatherWidget.refresh.test.tsx
    │   ├── WeatherWidget.popover.test.tsx
    │   ├── WeatherWidget.keyboard.test.tsx
    │   ├── WeatherWidget.form-submit.test.tsx
    │   ├── WeatherWidget.suggestion-click.test.tsx
    │   └── WeatherWidget.autocomplete-error.test.tsx
    └── Todo/
        ├── TodoWidget.smoke.test.tsx
        ├── TodoWidget.add.test.tsx
        ├── TodoWidget.edit.test.tsx
        ├── TodoWidget.filter.test.tsx
        ├── TodoWidget.undo-redo.test.tsx
        ├── TodoWidget.stats.test.tsx
        ├── TodoWidget.notifications.test.tsx
        ├── TodoWidget.multi-lists.test.tsx
        ├── TodoWidget.drag-drop.test.tsx
        └── TodoWidget.sync.test.tsx
```

## Types de tests

### Smoke Tests
Tests de base pour vérifier que les composants se rendent sans erreur :

```typescript
it("renders without crashing", () => {
  render(<WeatherWidget />);
});
```

### Unit Tests
Tests des hooks et utilitaires isolés :

- `useWeather` : Gestion des données météo
- `useAutocompleteCity` : Autocomplétion
- `useTodos` : Logique des todos
- Storage functions : Persistance localStorage

### Integration Tests
Tests des interactions entre composants :

- Ajout/suppression de todos
- Filtres et recherche
- Undo/Redo
- Multi-listes
- Notifications
- Synchronisation

### E2E-like Tests
Tests d'interactions utilisateur complètes :

- Navigation clavier
- Drag & drop
- Formulaires

## Mocking Strategy

### Composants shadcn/ui
Tous les composants UI sont mockés comme modules virtuels pour éviter les dépendances :

```typescript
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>
}), { virtual: true });
```

### Hooks personnalisés
Les hooks sont mockés pour isoler les tests des widgets :

```typescript
vi.mock("@/hooks/useWeather", () => ({
  useWeather: () => ({
    data: { city: "Paris", temperatureC: 20 },
    loading: false,
    error: undefined,
  }),
}));
```

### APIs externes
- `fetch` est mocké pour les appels OpenWeatherMap
- `localStorage` est mocké pour les tests de persistance
- `FileReader` est mocké pour les tests d'import/export

### Fake Timers
Utilisation de `vi.useFakeTimers()` pour :
- Tests de debounce
- Tests de refresh automatique
- Tests de notifications périodiques

## Configuration Vitest

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    fakeTimers: {
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
});
```

## Exécution des tests

```bash
# Tous les tests
pnpm test

# Tests en mode watch
pnpm test --watch

# Tests avec UI
pnpm test --ui

# Tests spécifiques
pnpm test tests/widgets/Weather

# Tests avec couverture
pnpm test --coverage
```

## Bonnes pratiques

1. **Isolation** : Chaque test est indépendant
2. **Mocking** : Toutes les dépendances externes sont mockées
3. **Assertions claires** : Tests avec des assertions explicites
4. **Nommage** : Noms de tests descriptifs
5. **Organisation** : Tests groupés par fonctionnalité

## Couverture actuelle

- ✅ Hooks personnalisés : 100%
- ✅ Widgets principaux : 100%
- ✅ Système de synchronisation : 100%
- ✅ Persistance localStorage : 100%
- ✅ Gestion d'erreurs : 100%

## Ajouter de nouveaux tests

1. Créer un fichier `*.test.tsx` dans `tests/widgets/` ou `tests/lib/`
2. Mocker les dépendances nécessaires
3. Tester les cas heureux et les cas d'erreur
4. Vérifier les interactions utilisateur importantes

Voir les tests existants pour des exemples de patterns.

