# 📊 Dashboard Personnel - Documentation Complète

## 🎯 Qu'est-ce que le Dashboard Personnel ?

Le **Dashboard Personnel** est une application web moderne et modulaire qui vous permet de créer votre propre tableau de bord personnalisé avec des widgets adaptatifs. C'est votre hub central pour organiser votre vie quotidienne : météo, tâches, calendrier, finances, habitudes, et bien plus encore.

### Concept principal

Au lieu d'avoir plusieurs applications séparées, le Dashboard Personnel regroupe tous vos outils essentiels en un seul endroit, avec une interface unifiée et personnalisable. Chaque widget est indépendant et peut être redimensionné, déplacé, ou supprimé selon vos besoins.

---

## ✨ Fonctionnalités principales

### 🎨 Interface personnalisable

- **Grille responsive** : Organisez vos widgets comme vous le souhaitez avec un système de grille drag & drop
- **Tailles adaptatives** : Chaque widget s'adapte automatiquement à sa taille (compact, medium, full)
- **Thème sombre/clair** : Basculez entre les thèmes selon vos préférences
- **Widgets externes** : Importez et utilisez des widgets personnalisés depuis des URLs

### 📦 Widgets intégrés

#### 🌤️ **Weather Widget** - Météo
- Conditions météo en temps réel
- Prévisions sur 5 jours
- Recherche de villes avec autocomplétion
- Mise à jour automatique toutes les 10 minutes
- Support de plusieurs villes

#### ✅ **Todo Widget** - Tâches
- Gestion complète de tâches (CRUD)
- Multi-listes (Pro, Perso, Projets, etc.)
- Priorités et deadlines
- Filtres avancés (Toutes, Actives, Terminées, Prioritaires)
- Recherche instantanée
- Statistiques visuelles avec graphiques
- Import/Export JSON (drag & drop)
- Notifications pour les deadlines
- **Synchronisation** : Google Tasks, Notion
- Undo/Redo avec historique

#### 📅 **Calendar Widget** - Calendrier
- Affichage mensuel, hebdomadaire et journalier
- Création, édition et suppression d'événements
- Sélection de couleur personnalisée
- Drag & drop pour déplacer les événements
- Export/Import JSON et .ics
- **Synchronisation** : Google Calendar, Microsoft Outlook
- Notifications pour les événements à venir
- Intégration avec les deadlines des tâches
- Récurrence d'événements

#### 📈 **Stock Widget** - Bourse
- Suivi de cours boursiers en temps réel
- Watchlist personnalisée
- Variations et pourcentages
- Cache pour performance
- Mise à jour automatique toutes les 5 minutes

#### 📚 **Bookmarks Widget** - Favoris
- Gestion de liens favoris avec URL
- Favicons automatiques
- Recherche par titre, URL, description ou tags
- Description et tags optionnels
- Ouverture dans nouvel onglet

#### 📝 **Journal Widget** - Journal personnel
- Entrées par date
- Vue des dernières entrées
- Édition et suppression
- Recherche par date

#### 🎯 **Habits Widget** - Habitudes
- Suivi de vos habitudes quotidiennes
- Système de streaks
- Heatmap des 7 derniers jours
- Statistiques détaillées
- Renouvellement quotidien automatique

#### 💰 **Finance Widget** - Finances
- Suivi des revenus et dépenses
- Budgets par catégorie
- Graphiques de répartition (camembert)
- Statistiques mensuelles
- Historique complet

#### 🍅 **Pomodoro Widget** - Productivité
- Timer Pomodoro (25 min)
- Sessions de travail
- Statistiques de sessions
- Historique des sessions

#### 📰 **RSS Widget** - Actualités
- Lecteur de flux RSS
- Ajout de flux personnalisés
- Marquer comme lu/non lu
- Vue des derniers articles

#### 💬 **Quote Widget** - Citations
- Citations inspirantes quotidiennes
- Système de favoris
- Refresh automatique (mode compact)
- Citations par défaut incluses

#### 📊 **Stats Widget** - Statistiques
- Vue d'ensemble de tous vos widgets
- Statistiques agrégées
- Graphiques de synthèse

---

## 🔌 Intégrations et synchronisation

### OAuth et APIs externes

Le Dashboard Personnel se connecte à plusieurs services pour synchroniser vos données :

#### Google
- **Google Calendar** : Synchronisation bidirectionnelle des événements
- **Google Tasks** : Synchronisation des tâches avec vos listes Google

#### Microsoft
- **Outlook Calendar** : Synchronisation des événements Outlook

#### Notion
- **Notion API** : Synchronisation des tâches avec vos bases de données Notion

### Configuration OAuth

Voir [OAUTH_SETUP.md](./OAUTH_SETUP.md) pour la configuration détaillée de chaque provider.

### APIs publiques utilisées

- **OpenWeatherMap** : Données météo (clé API requise)
- **Alpha Vantage / Yahoo Finance** : Données boursières (optionnel)
- **RSS Feeds** : Flux RSS publics

---

## 🏗️ Architecture technique

### Stack technologique

- **Frontend** : React 19 avec TypeScript 5.9
- **Build** : Vite 7
- **Styling** : Tailwind CSS v4
- **UI Components** : shadcn/ui (basé sur Radix UI)
- **State Management** : Zustand
- **Animations** : Framer Motion
- **Charts** : Recharts
- **Grid Layout** : react-grid-layout
- **Notifications** : Web Notifications API + Sonner
- **Testing** : Vitest + Testing Library
- **Backend OAuth** : Express (Node.js)

### Architecture modulaire

Le projet suit une architecture modulaire avec séparation claire des responsabilités :

```
src/
├── components/     # Composants UI réutilisables
│   ├── ui/         # Composants shadcn/ui
│   └── Dashboard/  # Composants spécifiques au dashboard
├── hooks/          # Hooks personnalisés (useWeather, useTodos, etc.)
├── lib/            # Utilitaires et logique métier
│   ├── auth/       # Gestion OAuth
│   ├── sync/       # Système de synchronisation
│   └── widgetLibrary/  # Système de widgets externes
├── store/          # Gestion d'état et persistance (localStorage)
├── widgets/        # Widgets du dashboard
└── pages/          # Pages de l'application
```

### Persistance des données

Toutes les données sont stockées localement dans le navigateur via `localStorage`. Aucune donnée n'est envoyée à des serveurs externes (sauf pour les synchronisations OAuth que vous configurez explicitement).

---

## 🚀 Déploiement

### Déploiement gratuit

Le Dashboard Personnel peut être déployé gratuitement sur :

- **Frontend** : Vercel (illimité pour projets personnels)
- **Backend OAuth** : Railway ou Render (plans gratuits disponibles)

Voir [DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md) pour le guide complet de déploiement.

---

## 📚 Créer des widgets personnalisés

Le Dashboard Personnel supporte un système de **bibliothèque de widgets** qui permet d'ajouter des widgets personnalisés depuis des sources externes.

### Fonctionnalités

- Créer vos propres widgets en JavaScript/TypeScript
- Importer des widgets depuis des URLs
- Partager des bibliothèques de widgets
- Validation automatique des widgets

Voir [WIDGET_LIBRARY.md](./WIDGET_LIBRARY.md) pour le guide complet.

---

## 🧪 Tests

Le projet inclut une suite de tests complète avec **447 tests** couvrant :

- Tous les widgets
- Hooks personnalisés
- Système de synchronisation
- Gestion d'état
- Persistance des données

### Lancer les tests

```bash
pnpm test              # Tous les tests
pnpm test --watch      # Mode watch
pnpm test --coverage   # Avec couverture
pnpm test --ui         # Interface graphique
```

---

## 🎨 Personnalisation

### Tailles de widgets

Chaque widget s'adapte automatiquement à sa taille :

- **Compact** : Widgets petits (≤ 3x3)
- **Medium** : Widgets moyens (≤ 5x6)
- **Full** : Widgets grands (> 5x6)

Les widgets affichent plus ou moins de détails selon leur taille disponible.

### Thèmes

- Thème clair
- Thème sombre
- Basculement automatique selon les préférences système

---

## 🔒 Sécurité et confidentialité

- **Données locales** : Toutes les données sont stockées dans votre navigateur
- **OAuth sécurisé** : Les tokens OAuth sont stockés localement et ne sont jamais exposés
- **Pas de tracking** : Aucun analytics ou tracking tiers
- **Open Source** : Code source entièrement visible et auditable

---

## 📖 Documentation complète

- [Guide de déploiement](./DEPLOYMENT_COMPLETE.md) - Déployer sur Vercel + Railway/Render
- [Configuration OAuth](./OAUTH_SETUP.md) - Configurer Google, Microsoft, Notion
- [Bibliothèque de widgets](./WIDGET_LIBRARY.md) - Créer et importer des widgets
- [Architecture technique](./ARCHITECTURE.md) - Détails techniques et patterns
- [Optimisations](./OPTIMIZATION.md) - Performance et bundle size

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Le projet est open source et accepte les pull requests.

---

## 📝 License

MIT License - Voir [LICENSE](../LICENSE) pour plus de détails.

---

**Fait avec ❤️ par [Mars375](https://github.com/Mars375)**

