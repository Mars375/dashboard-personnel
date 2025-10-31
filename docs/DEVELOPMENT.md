# 💻 Guide de développement

## Prérequis

- **Node.js** : 18+ ou 20+
- **pnpm** : 8+ (recommandé) ou npm/yarn
- **Git** : Pour la gestion de version

## Installation initiale

```bash
# Cloner le repository
git clone https://github.com/Mars375/dashboard-personnel.git
cd dashboard-personnel

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local et ajouter votre clé API OpenWeatherMap
```

## Scripts disponibles

```bash
# Développement
pnpm dev              # Serveur de dev sur http://localhost:5173

# Build
pnpm build            # Build de production
pnpm preview          # Prévisualiser le build

# Tests
pnpm test             # Lancer tous les tests
pnpm test --watch      # Mode watch
pnpm test --ui         # Interface UI Vitest
pnpm test --coverage   # Avec couverture de code

# Qualité de code
pnpm lint             # Vérifier le code avec ESLint
```

## Workflow Git

### Branches

- **`main`** : Branche principale, code stable
- **`feat/*`** : Nouvelles fonctionnalités
- **`fix/*`** : Corrections de bugs
- **`refactor/*`** : Refactorisations

### Convention de commits

Format : `type(scope): description`

Types :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `refactor` : Refactorisation
- `docs` : Documentation
- `test` : Tests
- `style` : Formatage
- `chore` : Maintenance

Exemples :
```
feat(weather): add 5-day forecast
fix(todo): correct deadline calculation
refactor: reorganize project structure
docs: update README with new features
```

### Processus de développement

1. **Créer une branche** :
   ```bash
   git checkout -b feat/ma-feature
   ```

2. **Développer et tester** :
   ```bash
   pnpm dev
   pnpm test
   ```

3. **Commit régulièrement** :
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push et créer une PR** :
   ```bash
   git push origin feat/ma-feature
   # Créer une Pull Request sur GitHub
   ```

## Architecture des widgets

### Créer un nouveau widget

1. Créer le dossier dans `src/widgets/NomWidget/`
2. Implémenter le composant principal
3. Ajouter les hooks nécessaires dans `src/hooks/`
4. Ajouter la persistance dans `src/store/` si nécessaire
5. Intégrer dans `src/App.tsx`

Exemple de structure :
```
src/widgets/NomWidget/
├── NomWidget.tsx      # Composant principal
└── index.ts          # Export (optionnel)
```

### Utiliser shadcn/ui

```bash
# Ajouter un composant
pnpm dlx shadcn@latest add button --yes

# Liste des composants disponibles
pnpm dlx shadcn@latest add --help
```

## Bonnes pratiques

### Code

- **TypeScript strict** : Utiliser les types partout
- **Composants fonctionnels** : Utiliser des fonctions, pas des classes
- **Hooks personnalisés** : Extraire la logique réutilisable
- **Nommage explicite** : Variables et fonctions avec des noms clairs
- **Commentaires** : Documenter la logique complexe

### Structure

- **Un fichier = une responsabilité**
- **Hooks dans `/hooks`**, pas dans les composants
- **Store dans `/store`** pour l'état global
- **Utilitaires dans `/lib`**

### Tests

- **Un test par comportement**
- **Nommer les tests clairement** : `it("should do X when Y")`
- **Tester les cas limites**
- **Isoler les tests** : Mock toutes les dépendances

### Performance

- **Memoization** : Utiliser `useMemo` et `useCallback` si nécessaire
- **Lazy loading** : Charger les widgets à la demande
- **Code splitting** : Séparer les bundles par route/widget

## Debugging

### DevTools

- **React DevTools** : Inspecter les composants
- **Vitest UI** : Debugger les tests avec `pnpm test --ui`
- **Browser DevTools** : Console, Network, etc.

### Logs

```typescript
// En développement uniquement
if (import.meta.env.DEV) {
  console.log("Debug info", data);
}
```

## Variables d'environnement

Créer un fichier `.env.local` :

```env
# OpenWeatherMap API
VITE_OPENWEATHER_API_KEY=votre_cle_api

# Notion API (optionnel)
VITE_NOTION_API_KEY=votre_cle_notion
VITE_NOTION_DATABASE_ID=votre_db_id

# Google Tasks API (optionnel)
VITE_GOOGLE_TASKS_CLIENT_ID=votre_client_id
VITE_GOOGLE_TASKS_CLIENT_SECRET=votre_client_secret
```

⚠️ **Important** : Ne jamais commiter `.env.local` !

## Résolution de problèmes courants

### Erreurs de build

```bash
# Nettoyer et réinstaller
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Tests qui échouent

```bash
# Vérifier les mocks
pnpm test --reporter=verbose

# Nettoyer le cache Vitest
rm -rf node_modules/.vite
```

### Problèmes de types TypeScript

```bash
# Vérifier les types
pnpm build
# ou
npx tsc --noEmit
```

