# 🧩 Documentation des Widgets

## Vue d'ensemble

Le Dashboard Personnel est construit autour d'un système de widgets modulaires. Chaque widget est autonome et peut être utilisé indépendamment.

## Architecture d'un widget

Un widget typique contient :
- **Composant React** : Interface utilisateur
- **Hook(s) personnalisé(s)** : Logique métier
- **Store (optionnel)** : État global si nécessaire
- **Tests** : Suite de tests complète

## Weather Widget 🌤️

### Fonctionnalités

- Recherche de ville avec autocomplétion
- Affichage météo en temps réel
- Prévisions sur 5 jours
- Refresh automatique (10 min)
- Persistance de la dernière ville

### Hooks utilisés

- `useWeather` : Gestion des données météo
- `useAutocompleteCity` : Autocomplétion des villes

### Storage

- `weatherStorage` : Dernière ville recherchée

### API

- OpenWeatherMap API (Current Weather + 5 Day Forecast + Geocoding)

### Composants UI

- `Card`, `Input`, `Button`, `Skeleton`
- `Popover`, `Command` (pour l'autocomplétion)

### Tests

10 fichiers de tests couvrant :
- Rendering de base
- États de chargement/erreur
- Prévisions
- Autocomplétion (keyboard, click, erreurs)
- Refresh
- Form submission

## Bookmarks Widget 🔖

### Fonctionnalités

- Gestion de liens favoris avec URL
- Favicons automatiques
- Recherche par titre, URL, description ou tags
- Description optionnelle
- Tags optionnels
- Ouverture dans nouvel onglet

### Storage

- `bookmarksStorage` : Persistance localStorage

### Tests

- Smoke tests : Rendering de base
- Storage tests : CRUD complet

## Todo Widget ✅

### Fonctionnalités

#### CRUD de base
- ✅ Ajouter des tâches
- ✅ Éditer inline (double-clic)
- ✅ Supprimer (avec confirmation)
- ✅ Marquer comme terminée

#### Organisation
- 🔀 Multi-listes (Pro, Perso, Projets, etc.)
- 🏷️ Priorisation (étoile)
- 📅 Deadlines avec badges
- 🔍 Recherche instantanée
- 📊 Statistiques visuelles

#### Style
- 🎨 Style épuré avec bordure légère
- ⭐ Distinction visuelle pour les tâches prioritaires (bordure jaune)
- 🖱️ Actions au hover (édition, suppression, priorité)

#### Filtres
- Toutes les tâches
- Actives uniquement
- Terminées uniquement
- Prioritaires uniquement
- Recherche par texte

#### Avancé
- 📥📤 Import/Export JSON (drag & drop)
- ↩️↪️ Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
- 🔔 Notifications pour deadlines
- 🔄 Synchronisation API (Notion, Google Tasks)
- 📈 Graphiques de statistiques

### Hooks utilisés

- `useTodos` : Interface avec le store Zustand

### Store

- `todoStore` : Store Zustand principal
- `todoStorage` : Persistance localStorage
- `todoLists` : Gestion des listes

### Storage

Les todos sont sauvegardés par liste :
```
todos:list-pro
todos:list-perso
todos:list-projets
```

### Composants UI

- `Card`, `Input`, `Button`, `Checkbox`
- `Progress`, `Dialog`, `Tooltip`, `DropdownMenu`
- `Chart` (Recharts), `Select`, `ButtonGroup`
- `Sonner` (Toasts)

### Tests

19 fichiers de tests couvrant :
- CRUD complet
- Filtres et recherche
- Multi-listes
- Undo/Redo
- Statistiques
- Notifications
- Drag & Drop
- Synchronisation

## Créer un nouveau widget

### Structure de base

```
src/widgets/MonWidget/
├── MonWidget.tsx      # Composant principal
└── index.ts          # Export (optionnel)
```

### Exemple minimal

```typescript
// src/widgets/MonWidget/MonWidget.tsx
import { Card } from "@/components/ui/card";

export function MonWidget() {
  return (
    <Card className="w-full max-w-sm p-4">
      <h2>Mon Widget</h2>
      {/* Contenu */}
    </Card>
  );
}
```

### Intégration dans App.tsx

```typescript
import { MonWidget } from "@/widgets/MonWidget/MonWidget";

function App() {
  return (
    <div>
      <WeatherWidget />
      <TodoWidget />
      <MonWidget />  {/* Ajouter ici */}
    </div>
  );
}
```

### Ajouter des hooks

Si votre widget a besoin de logique :

```typescript
// src/hooks/useMonWidget.ts
export function useMonWidget() {
  // Logique ici
  return { data, loading, error };
}

// Dans le widget
const { data } = useMonWidget();
```

### Ajouter de la persistance

```typescript
// src/store/monWidgetStorage.ts
export function saveMonWidgetData(data: Data) {
  try {
    localStorage.setItem("monWidget:data", JSON.stringify(data));
  } catch {
    // Gérer l'erreur
  }
}
```

### Tests

Créer `tests/widgets/MonWidget/MonWidget.test.tsx` :

```typescript
import { render, screen } from "@testing-library/react";
import { MonWidget } from "@/widgets/MonWidget/MonWidget";

describe("MonWidget", () => {
  it("renders without crashing", () => {
    render(<MonWidget />);
    expect(screen.getByText("Mon Widget")).toBeTruthy();
  });
});
```

## Best Practices

### 1. Isolation

Chaque widget doit être indépendant :
- Pas de dépendances directes entre widgets
- Communication via props si nécessaire

### 2. Responsive

Utiliser Tailwind pour le responsive :
```typescript
<Card className="w-full max-w-sm p-4">
```

### 3. Accessibilité

- Labels pour les inputs
- ARIA attributes
- Navigation clavier
- Contraste suffisant

### 4. Performance

- Lazy loading si le widget est lourd
- Memoization des calculs coûteux
- Éviter les re-renders inutiles

### 5. États

Gérer tous les états :
- Loading
- Error
- Empty
- Success/Data

## Calendar Widget 📅

### Fonctionnalités

#### Fonctionnalités de base
- ✅ Affichage calendrier mensuel (shadcn/ui Calendar)
- ✅ Navigation mois (précédent/suivant, aujourd'hui)
- ✅ Gestion d'événements (ajouter, modifier, supprimer)
- ✅ Sélection de couleur personnalisée (8 couleurs)
- ✅ Affichage événements par date sélectionnée
- ✅ Persistance localStorage

#### Vues multiples
- ✅ Vue mensuelle (calendrier traditionnel)
- ✅ Vue hebdomadaire (grille 7 jours avec événements)
- ✅ Vue journalière (timeline horaire 24h)

#### Fonctionnalités avancées
- ✅ Export/Import JSON et ICS
- ✅ Notifications pour événements à venir
- ✅ Synchronisation API (Google Calendar, Outlook)
- ✅ Drag & drop pour déplacer événements
- ✅ Intégration avec deadlines Todo
- ✅ Style moderne inspiré de Calendar31

### Hooks utilisés

- `useCalendar` : Gestion des événements et navigation calendrier

### Storage

- `calendarStorage` : Persistance des événements en localStorage

### API

- Google Calendar API (synchronisation)
- Outlook Calendar API (synchronisation)

### Composants UI

- `Card`, `Button`, `Calendar` (shadcn/ui)
- `Dialog`, `Popover`, `Input`, `Label`
- `DropdownMenu`, `ButtonGroup`, `Separator`
- `motion` (Framer Motion pour animations)

### Style

- **Style Calendar31** : Barre colorée à gauche pour les événements
- **Couleurs personnalisées** : 8 couleurs prédéfinies (bleu, vert, rouge, orange, violet, rose, cyan)
- **Affichage épuré** : Structure cohérente avec `bg-muted`, `pl-6`
- **Actions au hover** : Édition et suppression visibles au survol

### Tests

2 fichiers de tests couvrant :
- Rendering de base (smoke tests)
- Gestion des événements (CRUD)
- Dialog et interactions

## Widgets futurs

### Finance Widget 💰

- Suivi de budget
- Dépenses/revenus
- Graphiques et rapports

### Notes Widget 📝

- Prise de notes rapide
- Markdown support
- Recherche

