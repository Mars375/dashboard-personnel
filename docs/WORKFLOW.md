# 🔄 Workflow de Développement

## 📋 Convention de Nommage des Branches

### Format

```
<type>/<description>
```

**Note** : Git n'accepte pas les deux-points (`:`) dans les noms de branches, on utilise donc des slashes (`/`)

### Types de Branches

- **`fix/`** - Corrections de bugs et optimisations
  - Exemple : `fix/optimisation-bundle`, `fix/typescript-errors`
- **`feat/`** - Nouvelles fonctionnalités et widgets
  - Exemple : `feat/notes-widget`, `feat/habits-widget`
- **`refactor/`** - Refactoring de code
  - Exemple : `refactor/calendar-full`, `refactor/google-tasks-sync`
- **`docs/`** - Documentation uniquement
  - Exemple : `docs/api-documentation`, `docs/widget-guide`
- **`test/`** - Ajout ou amélioration de tests
  - Exemple : `test/coverage-improvement`, `test/e2e-setup`

---

## 🔄 Processus de Développement

### Étape 1 : Création de la Branche

```bash
git checkout -b <type>/<description>
```

### Étape 2 : Développement

- Travail sur la branche
- Commits réguliers avec messages clairs
- MVP si nouvelle feature

### Étape 3 : Implémentation Complète

- Fonctionnalités complètes
- Optimisations
- Gestion d'erreurs

### Étape 4 : Tests

- Tests unitaires
- Tests d'intégration
- Tests E2E si nécessaire
- Vérification de la couverture

### Étape 5 : Documentation

- JSDoc pour les nouvelles fonctions
- Mise à jour de la documentation
- Exemples si nécessaire

### Étape 6 : Push et Merge

```bash
git push origin <type>/<description>
# Créer une Pull Request
# Code review
# Merge après validation
```

---

## 📝 Messages de Commit

### Format

```
<type>: <description courte>

<description détaillée si nécessaire>
```

### Exemples

```
fix: correction des erreurs TypeScript

- Suppression des imports non utilisés
- Correction des types NodeJS
- Fix ZodError.errors -> error.issues
```

```
feat: ajout du Notes Widget

- Création, édition et suppression de notes
- Support Markdown basique
- Recherche et catégories
- Export/Import JSON
```

---

## 🎯 Plan d'Action Prioritaires

### Phase 1 : Optimisations (Priorité Haute)

1. `fix/optimisation-bundle-recharts` - Lazy loading Recharts
2. `fix/optimisation-performance` - Memoization et virtualisation
3. `refactor/calendar-full` - Refactoring du composant calendar-full
4. `refactor/google-tasks-sync` - Refactoring du service de sync

### Phase 2 : Nouveaux Widgets (Priorité Moyenne)

1. `feat/notes-widget` - Widget de notes
2. `feat/habits-widget` - Widget de suivi d'habitudes
3. `feat/journal-widget` - Widget de journal
4. `feat/finance-widget` - Widget de finances
5. `feat/pomodoro-widget` - Widget Pomodoro
6. `feat/stats-widget` - Widget de statistiques
7. `feat/rss-widget` - Widget RSS
8. `feat/bookmark-widget` - Widget de favoris
9. `feat/quote-widget` - Widget de citations
10. `feat/graphiques-widget` - Widget de graphiques personnalisés

### Phase 3 : Système Avancé (Priorité Basse)

1. `feat/widget-library` - Système de bibliothèque de widgets
2. `feat/widget-marketplace` - Marketplace de widgets
3. `feat/widget-plugins` - Système de plugins

---

## ✅ Checklist de Merge

Avant de merger une branche, vérifier :

- [ ] Code compilé sans erreurs (`pnpm build`)
- [ ] Tests passent (`pnpm test`)
- [ ] Couverture de tests > 80% (si nouvelle feature)
- [ ] Documentation mise à jour
- [ ] Pas de console.log restants
- [ ] Types TypeScript corrects
- [ ] Linting OK (`pnpm lint`)
- [ ] Bundle size acceptable
- [ ] Performance acceptable

---

---

## 🎨 Exemples Pratiques

### Exemple 1 : Créer une Branche pour un Nouveau Widget

```bash
# 1. Créer la branche
git checkout -b feat/notes-widget

# 2. Créer la structure du widget
mkdir -p src/widgets/Notes/components
touch src/widgets/Notes/NotesWidget.tsx
touch src/widgets/Notes/components/NoteItem.tsx
touch src/widgets/Notes/components/NoteEditor.tsx

# 3. Développer le MVP
# ... travail sur le widget ...

# 4. Commits réguliers
git add .
git commit -m "feat: structure de base du Notes Widget"
git commit -m "feat: ajout de la création et édition de notes"
git commit -m "feat: ajout de la recherche et des catégories"

# 5. Tests
pnpm test

# 6. Documentation
# Ajouter JSDoc et mettre à jour docs/WIDGETS.md

# 7. Push et PR
git push origin feat/notes-widget
# Créer une Pull Request sur GitHub
```

### Exemple 2 : Créer une Branche pour une Optimisation

```bash
# 1. Créer la branche
git checkout -b fix/optimisation-bundle-recharts

# 2. Analyser le problème
pnpm build:analyze

# 3. Implémenter la solution
# ... lazy loading des graphiques ...

# 4. Mesurer l'impact
pnpm build
# Vérifier la taille du bundle

# 5. Tests
pnpm test
pnpm build

# 6. Commit et push
git add .
git commit -m "fix: lazy loading des graphiques Recharts

- Réduction du bundle initial de 369 KB
- Chargement à la demande des composants graphiques
- Impact: -369 KB du chunk charts-vendor"

git push origin fix/optimisation-bundle-recharts
```

### Exemple 3 : Refactoring d'un Fichier Volumineux

```bash
# 1. Créer la branche
git checkout -b refactor/calendar-full

# 2. Extraire les composants
# - CalendarGrid.tsx
# - CalendarHeader.tsx
# - CalendarDay.tsx
# - CalendarModifiers.tsx

# 3. Tests après chaque extraction
pnpm test

# 4. Commits atomiques
git add src/components/ui/calendar/CalendarGrid.tsx
git commit -m "refactor: extraction de CalendarGrid depuis calendar-full"

git add src/components/ui/calendar/CalendarHeader.tsx
git commit -m "refactor: extraction de CalendarHeader depuis calendar-full"

# ... etc

# 5. Vérification finale
pnpm build
pnpm test

# 6. Push
git push origin refactor/calendar-full
```

---

## 🔍 Code Review Guidelines

### Checklist pour le Reviewer

#### Code Quality
- [ ] Code lisible et bien commenté
- [ ] Nommage cohérent et descriptif
- [ ] Pas de code dupliqué
- [ ] Pas de console.log restants
- [ ] Types TypeScript corrects (pas de `any` inutiles)

#### Architecture
- [ ] Séparation des responsabilités
- [ ] Composants réutilisables
- [ ] Hooks personnalisés si nécessaire
- [ ] Structure de fichiers cohérente

#### Performance
- [ ] Pas de re-renders inutiles
- [ ] Lazy loading si nécessaire
- [ ] Mémoization si calculs coûteux
- [ ] Bundle size acceptable

#### Tests
- [ ] Tests unitaires pour la logique
- [ ] Tests d'intégration si nécessaire
- [ ] Couverture > 80% pour nouvelles features
- [ ] Tests passent tous

#### Documentation
- [ ] JSDoc pour fonctions publiques
- [ ] README mis à jour si nécessaire
- [ ] Exemples si nouvelle API
- [ ] Changelog mis à jour

---

## 🚨 Gestion des Conflits

### Prévention
- Faire des `git pull origin main` régulièrement
- Rester à jour avec les changements de main
- Communiquer avec l'équipe sur les fichiers modifiés

### Résolution
```bash
# 1. Mettre à jour la branche
git checkout main
git pull origin main

# 2. Revenir sur la branche
git checkout fix/optimisation-bundle-recharts

# 3. Rebaser ou merger
git rebase main
# OU
git merge main

# 4. Résoudre les conflits
# Éditer les fichiers en conflit
# git add <fichiers résolus>
# git rebase --continue (si rebase)
# OU
# git commit (si merge)
```

---

## 📦 Release Process

### Versioning
- **Major** (1.0.0) : Breaking changes
- **Minor** (0.1.0) : Nouvelles fonctionnalités
- **Patch** (0.0.1) : Corrections de bugs

### Processus de Release

```bash
# 1. Merger toutes les branches validées
git checkout main
git pull origin main

# 2. Mettre à jour le version dans package.json
# 3. Créer un tag
git tag -a v0.1.0 -m "Release v0.1.0: Ajout Notes Widget"
git push origin v0.1.0

# 4. Créer un changelog
# 5. Mettre à jour la documentation
```

---

## 🐛 Debugging Guidelines

### Avant de Commencer
1. Vérifier que le problème est reproductible
2. Chercher dans les issues existantes
3. Vérifier la documentation

### Processus de Debug
1. **Isoler le problème** : Identifier où le bug se produit
2. **Reproduire** : Créer un cas de test minimal
3. **Analyser** : Utiliser les outils de debug (React DevTools, console, etc.)
4. **Corriger** : Implémenter la solution
5. **Tester** : Vérifier que le bug est corrigé et qu'aucune régression n'est introduite
6. **Documenter** : Documenter le bug et la solution dans le commit

---

## 📚 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org/)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
