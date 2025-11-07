# 📊 Dashboard Personnel

Un dashboard personnel moderne et modulaire construit avec React 19, TypeScript, Vite 7 et Tailwind CSS v4. Organisez votre vie quotidienne avec des widgets personnalisables : météo, tâches, calendrier, finances, habitudes, et bien plus encore.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19.1-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1-purple.svg)
![Tests](https://img.shields.io/badge/tests-447%20passing-brightgreen.svg)

## ✨ Fonctionnalités

### 🎨 Interface personnalisable

- **Grille responsive** : Organisez vos widgets avec drag & drop
- **Tailles adaptatives** : Chaque widget s'adapte automatiquement (compact, medium, full)
- **Thème sombre/clair** : Basculez selon vos préférences
- **Widgets externes** : Importez des widgets personnalisés depuis des URLs

### 📦 Widgets intégrés (12 widgets)

- **🌤️ Météo** : Conditions en temps réel, prévisions 5 jours, recherche de villes
- **✅ Tâches** : Multi-listes, priorités, deadlines, synchronisation Google Tasks/Notion
- **📅 Calendrier** : Vues mois/semaine/jour, événements, synchronisation Google Calendar/Outlook
- **📈 Bourse** : Suivi de cours en temps réel, watchlist personnalisée
- **📚 Favoris** : Gestion de bookmarks avec favicons automatiques
- **📝 Journal** : Journal personnel avec entrées par date
- **🎯 Habitudes** : Suivi d'habitudes avec streaks et heatmap
- **💰 Finances** : Revenus/dépenses, budgets, graphiques
- **🍅 Pomodoro** : Timer de productivité avec statistiques
- **📰 RSS** : Lecteur de flux RSS personnalisés
- **💬 Citations** : Citations inspirantes quotidiennes
- **📊 Statistiques** : Vue d'ensemble de tous vos widgets

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

#### OAuth (optionnel)

Pour utiliser la synchronisation avec Google, Microsoft ou Notion, voir [docs/OAUTH_SETUP.md](./docs/OAUTH_SETUP.md).

## 🏗️ Stack technique

- **Framework** : React 19 avec TypeScript 5.9
- **Build** : Vite 7
- **Styling** : Tailwind CSS v4
- **UI Components** : shadcn/ui (Radix UI)
- **State Management** : Zustand
- **Animations** : Framer Motion
- **Charts** : Recharts
- **Grid Layout** : react-grid-layout
- **Testing** : Vitest + Testing Library
- **Backend OAuth** : Express (Node.js)

## 🧪 Tests

Le projet inclut **447 tests** couvrant tous les widgets, hooks, et fonctionnalités.

```bash
pnpm test              # Tous les tests
pnpm test --watch      # Mode watch
pnpm test --coverage   # Avec couverture
pnpm test --ui         # Interface graphique
```

## 🚀 Déploiement

Le Dashboard Personnel peut être déployé gratuitement :

- **Frontend** : Vercel (gratuit, illimité)
- **Backend OAuth** : Railway ou Render (plans gratuits)

Voir [docs/DEPLOYMENT_COMPLETE.md](./docs/DEPLOYMENT_COMPLETE.md) pour le guide complet.

## 📚 Documentation

- 📖 [Documentation complète du projet](./docs/PROJECT.md) - Vue d'ensemble, fonctionnalités, architecture
- 🚀 [Guide de déploiement](./docs/DEPLOYMENT_COMPLETE.md) - Déployer sur Vercel + Railway/Render
- 🔐 [Configuration OAuth](./docs/OAUTH_SETUP.md) - Google, Microsoft, Notion
- 📚 [Bibliothèque de widgets](./docs/WIDGET_LIBRARY.md) - Créer et importer des widgets personnalisés
- 🏗️ [Architecture technique](./docs/ARCHITECTURE.md) - Détails techniques et patterns
- ⚡ [Optimisations](./docs/OPTIMIZATION.md) - Performance et bundle size

## 🛠️ Scripts disponibles

```bash
pnpm dev              # Serveur de développement
pnpm dev:server        # Serveur OAuth proxy (dev)
pnpm dev:all          # Frontend + Backend (dev)
pnpm build            # Build de production
pnpm preview           # Prévisualisation du build
pnpm test             # Lancer les tests
pnpm lint             # Vérifier le code avec ESLint
```

## 🔒 Confidentialité

- **Données locales** : Toutes les données sont stockées dans votre navigateur (localStorage)
- **OAuth sécurisé** : Les tokens sont stockés localement et ne sont jamais exposés
- **Pas de tracking** : Aucun analytics ou tracking tiers
- **Open Source** : Code source entièrement visible et auditable

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

## 🗺️ Roadmap / To Do

### Automatisation & IA (Coming Soon)

- **Automatisation via n8n** : Intégration de workflows automatisés pour connecter les widgets entre eux
- **IA intégrée** : Suggestions intelligentes, résumé automatique des tâches, prédictions de calendrier
- **Webhooks** : Support des webhooks pour déclencher des actions automatiques
- **Intégrations avancées** : Connexion avec plus de services (Slack, Discord, Telegram, etc.)

Voir [docs/AUTOMATION_IA.md](./docs/AUTOMATION_IA.md) pour plus de détails sur l'architecture prévue.

---

⭐ Si ce projet vous a aidé, pensez à mettre une étoile !
