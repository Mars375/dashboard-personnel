# 📁 Structure du projet

## Vue d'ensemble

```
dashboard-personnel/
├── docs/                    # Documentation complète
├── src/                     # Code source
├── tests/                   # Tests unitaires et d'intégration
├── public/                  # Assets statiques
├── dist/                    # Build de production (généré)
├── node_modules/            # Dépendances (généré)
├── .env.local               # Variables d'environnement (non commité)
├── package.json             # Dépendances et scripts
├── pnpm-lock.yaml           # Lockfile pnpm
├── tsconfig.json            # Configuration TypeScript
├── vite.config.ts           # Configuration Vite
├── vitest.config.ts         # Configuration Vitest
├── components.json          # Configuration shadcn/ui
└── README.md                # Documentation principale
```

## Structure détaillée

### `/src` - Code source

#### `/src/components/ui`
Composants UI réutilisables basés sur **shadcn/ui** :

```
components/ui/
├── badge.tsx               # Badge component
├── button.tsx               # Button component
├── button-group.tsx         # ButtonGroup component
├── calendar.tsx             # Calendar component (shadcn/ui)
├── card.tsx                 # Card component
├── chart.tsx                # Chart component (Recharts wrapper)
├── checkbox.tsx             # Checkbox component
├── command.tsx              # Command component (cmdk)
├── dialog.tsx               # Dialog component
├── dropdown-menu.tsx        # DropdownMenu component
├── input.tsx                # Input component
├── label.tsx                # Label component
├── popover.tsx              # Popover component
├── progress.tsx             # Progress component
├── select.tsx               # Select component
├── separator.tsx            # Separator component
├── skeleton.tsx             # Skeleton loader
├── sonner.tsx               # Toast component
└── tooltip.tsx              # Tooltip component
```

#### `/src/hooks`
Hooks personnalisés React :

```
hooks/
├── useWeather.ts            # Hook pour les données météo
├── useAutocompleteCity.ts   # Hook pour l'autocomplétion de villes
├── useTodos.ts              # Hook pour la gestion des todos
└── useCalendar.ts           # Hook pour la gestion du calendrier
```

#### `/src/lib`
Utilitaires et logique métier :

```
lib/
├── utils.ts                 # Utilitaires généraux (cn, etc.)
├── notifications.ts         # Web Notifications API
├── calendarExport.ts        # Export/Import calendrier (JSON/ICS)
├── calendarNotifications.ts # Notifications calendrier
└── sync/                    # Système de synchronisation
    ├── apiSync.ts           # Interfaces communes
    ├── syncManager.ts       # Orchestrateur de sync
    ├── notionSync.ts        # Provider Notion
    ├── googleTasksSync.ts  # Provider Google Tasks
    ├── calendarSync.ts      # Interfaces sync calendrier
    ├── calendarSyncManager.ts # Manager sync calendrier
    ├── googleCalendarSync.ts # Provider Google Calendar
    └── outlookSync.ts       # Provider Outlook Calendar
```

#### `/src/store`
Gestion d'état et persistance :

```
store/
├── todoStore.ts            # Store Zustand principal (todos)
├── todoStorage.ts           # Persistance localStorage (todos)
├── todoLists.ts            # Gestion des listes de todos
├── weatherStorage.ts        # Persistance météo (dernière ville)
└── calendarStorage.ts      # Persistance calendrier (événements)
```

#### `/src/widgets`
Widgets autonomes du dashboard :

```
widgets/
├── Weather/
│   └── WeatherWidget.tsx   # Widget météo complet
├── Todo/
│   └── TodoWidget.tsx      # Widget todo complet
├── Calendar/
│   ├── CalendarWidget.tsx  # Widget calendrier complet
│   └── types.ts            # Types TypeScript
└── Finance/                # À venir
```

#### `/src/components`
Composants React réutilisables (actuellement vide, UI components dans `components/ui`)

#### `/src/types`
Définitions de types TypeScript :

```
types/
└── shims.d.ts              # Types pour variables d'environnement
```

#### Fichiers racine

```
src/
├── App.tsx                 # Composant principal de l'application
├── App.css                 # Styles spécifiques à App
├── index.css               # Styles globaux et variables CSS
├── main.tsx                # Point d'entrée de l'application
└── assets/                 # Assets statiques (images, etc.)
    └── react.svg
```

### `/tests` - Tests

Structure parallèle à `/src` :

```
tests/
├── lib/                     # Tests des hooks et utilitaires
│   ├── storage.test.ts
│   ├── useWeather.smoke.test.tsx
│   ├── useAutocompleteCity.smoke.test.tsx
│   ├── useTodos.smoke.test.tsx
│   ├── todoStorage.smoke.test.ts
│   └── sync/                # Tests de synchronisation
│       ├── apiSync.test.ts
│       ├── notionSync.test.ts
│       ├── googleTasksSync.test.ts
│       └── syncManager.test.ts
└── widgets/                 # Tests des widgets
    ├── Weather/            # Tests Weather Widget
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
    ├── Todo/                # Tests Todo Widget
    │   ├── TodoWidget.smoke.test.tsx
    │   ├── TodoWidget.add.test.tsx
    │   ├── TodoWidget.edit.test.tsx
    │   ├── TodoWidget.filter.test.tsx
    │   ├── TodoWidget.undo-redo.test.tsx
    │   ├── TodoWidget.stats.test.tsx
    │   ├── TodoWidget.notifications.test.tsx
    │   ├── TodoWidget.multi-lists.test.tsx
    │   ├── TodoWidget.drag-drop.test.tsx
    │   └── TodoWidget.sync.test.tsx
    └── Calendar/            # Tests Calendar Widget
        ├── CalendarWidget.smoke.test.tsx
        └── CalendarWidget.events.test.tsx
```

### `/docs` - Documentation

```
docs/
├── README.md                # (à la racine)
├── ARCHITECTURE.md          # Architecture du projet
├── TESTS.md                 # Documentation des tests
├── DEVELOPMENT.md           # Guide de développement
├── API.md                   # API et intégrations
├── DEPLOYMENT.md            # Guide de déploiement
├── GETTING_STARTED.md       # Guide de démarrage
├── WORKFLOW.md              # Workflow de développement
├── WIDGETS.md               # Documentation des widgets
└── PROJECT_STRUCTURE.md     # Ce fichier
```

## Conventions de nommage

### Fichiers

- **Composants** : `PascalCase.tsx` (ex: `WeatherWidget.tsx`)
- **Hooks** : `camelCase.ts` avec préfixe `use` (ex: `useWeather.ts`)
- **Store** : `camelCase.ts` avec suffixe `Store` (ex: `todoStore.ts`)
- **Utils** : `camelCase.ts` (ex: `utils.ts`)
- **Tests** : `PascalCase.test.tsx` (ex: `WeatherWidget.test.tsx`)

### Dossiers

- **Widgets** : `PascalCase/` (ex: `Weather/`)
- **Hooks** : `hooks/` (singulier)
- **Store** : `store/` (singulier)
- **Components** : `components/` (pluriel)

## Imports

### Alias `@/`

Tous les imports utilisent l'alias `@/` qui pointe vers `src/` :

```typescript
// ✅ Bon
import { useWeather } from "@/hooks/useWeather";
import { WeatherWidget } from "@/widgets/Weather/WeatherWidget";

// ❌ Mauvais
import { useWeather } from "../../hooks/useWeather";
```

### Ordre des imports

1. **React** (imports externes)
2. **Third-party** (shadcn/ui, etc.)
3. **Internal** (hooks, store, lib)
4. **Relative** (fichiers proches)

```typescript
// 1. React
import { useEffect } from "react";

// 2. Third-party
import { Card } from "@/components/ui/card";

// 3. Internal
import { useWeather } from "@/hooks/useWeather";

// 4. Relative (rarement nécessaire)
import "./styles.css";
```

## Organisation par responsabilité

### Séparation des préoccupations

- **UI** : `components/ui/` - Composants présentationnels
- **Logique** : `hooks/` - Logique métier réutilisable
- **État** : `store/` - État global et persistance
- **Widgets** : `widgets/` - Composants autonomes
- **Utils** : `lib/` - Utilitaires et intégrations

### Découplage

- Les widgets ne dépendent pas directement entre eux
- Les hooks sont indépendants
- Le store est indépendant des widgets
- La logique métier est séparée de l'UI

## Évolutivité

### Ajouter un nouveau widget

1. Créer `src/widgets/NouveauWidget/`
2. Ajouter les hooks nécessaires dans `src/hooks/`
3. Ajouter la persistance dans `src/store/` si nécessaire
4. Intégrer dans `src/App.tsx`

### Ajouter une nouvelle fonctionnalité

1. Déterminer où elle appartient (hook, store, lib)
2. Créer les fichiers nécessaires
3. Ajouter les tests correspondants
4. Documenter si nécessaire

## Fichiers de configuration

### TypeScript

- `tsconfig.json` : Configuration TypeScript principale
- `tsconfig.app.json` : Config pour l'application
- `tsconfig.node.json` : Config pour les scripts Node

### Build

- `vite.config.ts` : Configuration Vite (build)
- `vitest.config.ts` : Configuration Vitest (tests)

### UI

- `components.json` : Configuration shadcn/ui

### Code Quality

- `eslint.config.js` : Configuration ESLint

## Bonnes pratiques

### 1. Organisation

- ✅ Un fichier = une responsabilité
- ✅ Dossiers par fonctionnalité
- ✅ Imports absolus (`@/`)

### 2. Nommage

- ✅ Noms explicites
- ✅ Conventions cohérentes
- ✅ Pas d'abréviations obscures

### 3. Séparation

- ✅ UI séparée de la logique
- ✅ État séparé des composants
- ✅ Tests parallèles à la structure

## Maintenance

### Nettoyer

- Supprimer les fichiers non utilisés
- Réorganiser si nécessaire
- Documenter les changements de structure

### Évoluer

- Ajouter des dossiers si besoin
- Séparer si ça devient trop gros
- Factoriser si du code est dupliqué

