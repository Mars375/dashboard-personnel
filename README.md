# 📊 Dashboard Personnel

Un dashboard personnel moderne et modulaire construit avec React 19, TypeScript, Vite 7 et Tailwind CSS v4. Ce projet propose des widgets personnalisables pour organiser votre vie quotidienne (météo, tâches, etc.).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19.1-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1-purple.svg)

## ✨ Fonctionnalités

### 🌤️ Weather Widget

- Affichage de la météo en temps réel via OpenWeatherMap API
- Recherche de ville avec autocomplétion intelligente
- Prévisions sur 5 jours
- Mise à jour automatique toutes les 10 minutes
- Persistance de la dernière ville recherchée

### ✅ Todo Widget

- Gestion complète de tâches (CRUD)
- Multi-listes (Pro, Perso, Projets, etc.)
- Priorisation et deadlines
- Filtres avancés (Toutes, Actives, Terminées, Prioritaires)
- Recherche instantanée
- Statistiques visuelles avec graphiques
- Import/Export JSON (drag & drop)
- Notifications pour les deadlines
- Synchronisation API (Notion, Google Tasks)
- Undo/Redo avec Zustand
- Animations fluides avec Framer Motion

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ ou 20+
- pnpm 8+

### Installation

```bash
# Cloner le repository
git clone https://github.com/Mars375/dashboard-personnel.git

# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev
```

L'application sera accessible sur `http://localhost:5173`

### Configuration

#### OpenWeatherMap API (Weather Widget)

1. Créer un compte sur [OpenWeatherMap](https://openweathermap.org/api)
2. Obtenir votre clé API gratuite
3. Créer un fichier `.env.local` à la racine du projet :

```env
VITE_OPENWEATHER_API_KEY=votre_cle_api
```

## 📁 Structure du projet

```
dashboard-personnel/
├── src/
│   ├── components/        # Composants UI réutilisables
│   │   └── ui/           # Composants shadcn/ui
│   ├── hooks/            # Hooks personnalisés
│   │   ├── useWeather.ts
│   │   ├── useAutocompleteCity.ts
│   │   └── useTodos.ts
│   ├── lib/              # Utilitaires et logique métier
│   │   ├── notifications.ts
│   │   ├── sync/         # Système de synchronisation
│   │   └── utils.ts
│   ├── store/            # Gestion d'état et persistance
│   │   ├── todoStore.ts  # Store Zustand pour todos
│   │   ├── todoStorage.ts
│   │   ├── todoLists.ts
│   │   └── weatherStorage.ts
│   ├── widgets/          # Widgets du dashboard
│   │   ├── Weather/
│   │   └── Todo/
│   └── App.tsx           # Point d'entrée de l'application
├── tests/                # Tests unitaires et d'intégration
│   ├── lib/
│   └── widgets/
├── docs/                 # Documentation détaillée
└── README.md
```

## 🧪 Tests

Le projet utilise **Vitest** et **Testing Library** pour une suite de tests complète.

### Lancer les tests

```bash
# Tous les tests
pnpm test

# Tests en mode watch
pnpm test --watch

# Tests avec couverture
pnpm test --coverage

# Tests en mode UI
pnpm test --ui
```

### Couverture de tests

- **29 fichiers de tests**
- **85 tests** couvrant :
  - Hooks personnalisés (useWeather, useAutocompleteCity, useTodos)
  - Widgets (Weather, Todo)
  - Système de synchronisation (Notion, Google Tasks)
  - Gestion d'état (Zustand)
  - Persistance (localStorage)

Voir [docs/TESTS.md](./docs/TESTS.md) pour plus de détails.

## 🏗️ Architecture

### Design Pattern

Le projet suit une architecture modulaire avec séparation des responsabilités :

- **Widgets** : Composants UI autonomes
- **Hooks** : Logique métier réutilisable
- **Store** : Gestion d'état global avec Zustand
- **Lib** : Utilitaires et intégrations externes

### Stack technique

- **Framework** : React 19 avec TypeScript
- **Build** : Vite 7
- **Styling** : Tailwind CSS v4
- **UI Components** : shadcn/ui (Radix UI)
- **State Management** : Zustand
- **Animations** : Framer Motion
- **Charts** : Recharts
- **Notifications** : Web Notifications API + Sonner
- **Testing** : Vitest + Testing Library

## 📚 Documentation détaillée

La documentation complète est disponible dans le dossier [`docs/`](./docs/) :

- 📖 [Guide de démarrage](./docs/GETTING_STARTED.md) - Démarrage rapide pour nouveaux utilisateurs
- 🏗️ [Architecture du projet](./docs/ARCHITECTURE.md) - Structure, patterns et flux de données
- 🧪 [Documentation des tests](./docs/TESTS.md) - Stratégie de tests et couverture
- 💻 [Guide de développement](./docs/DEVELOPMENT.md) - Workflow et bonnes pratiques
- 🔌 [API et intégrations](./docs/API.md) - OpenWeatherMap, Notion, Google Tasks
- 🚀 [Guide de déploiement](./docs/DEPLOYMENT.md) - Vercel, Netlify, GitHub Pages
- 🧩 [Documentation des widgets](./docs/WIDGETS.md) - Architecture et création de widgets
- 📁 [Structure du projet](./docs/PROJECT_STRUCTURE.md) - Organisation détaillée
- 🔄 [Workflow de développement](./docs/WORKFLOW.md) - Cycle de vie des features

## 🛠️ Scripts disponibles

```bash
pnpm dev       # Serveur de développement
pnpm build     # Build de production
pnpm preview   # Prévisualisation du build
pnpm test      # Lancer les tests
pnpm lint      # Vérifier le code avec ESLint
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feat/ma-feature`)
3. Commit vos changements (`git commit -m 'feat: ajout ma feature'`)
4. Push sur la branche (`git push origin feat/ma-feature`)
5. Ouvrir une Pull Request

## 📝 License

MIT License - voir [LICENSE](./LICENSE) pour plus de détails.

## 👤 Auteur

**Mars375**

- GitHub: [@Mars375](https://github.com/Mars375)

---

⭐ Si ce projet vous a aidé, pensez à mettre une étoile !
