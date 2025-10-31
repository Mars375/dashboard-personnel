# 🔄 Workflow de développement

## Vue d'ensemble

Ce document décrit le workflow de développement du Dashboard Personnel, de la création d'une feature jusqu'au merge sur main.

## Cycle de vie d'une feature

### 1. Planification

Avant de commencer :
- Définir clairement l'objectif de la feature
- Lister les fonctionnalités nécessaires
- Estimer la complexité
- Créer une issue GitHub (optionnel)

### 2. Développement

#### Créer une branche

```bash
# Depuis main, à jour
git checkout main
git pull origin main

# Créer la branche
git checkout -b feat/nom-feature
```

#### Convention de nommage des branches

- `feat/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `refactor/*` : Refactorisations
- `docs/*` : Documentation
- `test/*` : Ajout de tests
- `chore/*` : Maintenance

Exemples :
```
feat/weather-widget
fix/todo-deadline-bug
refactor/hooks-structure
docs/api-documentation
```

### 3. Développement itératif

#### Workflow recommandé

1. **MVP d'abord** : Implémenter la version minimale fonctionnelle
2. **Structure projet** : Organiser le code (hooks, store, etc.)
3. **Tests** : Ajouter des smoke tests dès le début
4. **Intégration** : Intégrer avec le reste de l'app
5. **Refactor/UX** : Améliorer l'UX et refactoriser si nécessaire

#### Exemple : Développement d'un widget

```
1. MVP clair
   → Widget basique qui fonctionne

2. Structure projet
   → Créer hooks/, store/ si nécessaire
   → Organiser les fichiers

3. Tests smoke
   → Tests de base qui passent
   → Vérifier le build

4. Intégration
   → Intégrer dans App.tsx
   → Vérifier avec les autres widgets

5. Refactor/UX avancée
   → Améliorer l'interface
   → Ajouter animations
   → Optimiser les performances

6. Tests complets
   → Suite de tests complète
   → Couverture maximale
```

### 4. Tests

#### À chaque étape

```bash
# Vérifier que ça compile
pnpm run build

# Vérifier que les tests passent
pnpm test

# Vérifier le lint
pnpm lint
```

#### Ajouter des tests

1. **Smoke tests d'abord** : Vérifier que ça rend
2. **Tests unitaires** : Tester la logique isolée
3. **Tests d'intégration** : Tester les interactions
4. **Tests E2E-like** : Tester les scénarios utilisateur

### 5. Commit régulier

#### Fréquence

Commit après chaque étape logique :
- Fonctionnalité ajoutée
- Bug corrigé
- Refactorisation
- Tests ajoutés

#### Message de commit

Format : `type(scope): description`

```bash
# Exemples
git commit -m "feat(weather): add 5-day forecast"
git commit -m "fix(todo): correct deadline calculation"
git commit -m "refactor: reorganize hooks structure"
git commit -m "test(weather): add smoke tests"
git commit -m "docs: update README with new features"
```

### 6. Push et Pull Request

#### Push régulier

```bash
# Push régulier pour sauvegarder
git push origin feat/nom-feature
```

#### Créer une Pull Request

1. Aller sur GitHub
2. Créer une Pull Request
3. Remplir le template (si disponible)
4. Attendre la review (ou auto-merge)

#### Description de PR

Inclure :
- **Objectif** : Ce que fait cette PR
- **Changements** : Liste des modifications
- **Tests** : Tests ajoutés/modifiés
- **Screenshots** : Si changement UI (optionnel)

### 7. Review et merge

#### Avant de merger

- [ ] Tous les tests passent
- [ ] Le build fonctionne
- [ ] Pas d'erreurs de lint
- [ ] Documentation à jour
- [ ] Code review effectué (si applicable)

#### Merge sur main

```bash
# Après approbation, merger sur main
git checkout main
git pull origin main
git merge feat/nom-feature
git push origin main
```

## Workflow spécifique par tâche

### Ajouter un nouveau widget

1. **Créer le dossier** : `src/widgets/NomWidget/`
2. **MVP** : Composant basique fonctionnel
3. **Hooks** : Créer hooks nécessaires dans `src/hooks/`
4. **Store** : Créer store si nécessaire dans `src/store/`
5. **Tests** : Ajouter tests dans `tests/widgets/NomWidget/`
6. **Intégration** : Ajouter dans `src/App.tsx`
7. **Refactor** : Améliorer UX et performance

### Corriger un bug

1. **Reproduire** : Créer un test qui reproduit le bug
2. **Fixer** : Corriger le bug
3. **Vérifier** : Le test passe maintenant
4. **Commit** : `git commit -m "fix(scope): fix bug description"`

### Refactoriser

1. **Identifier** : Code à refactoriser
2. **Planifier** : Nouvelle structure
3. **Refactoriser** : Par petites étapes
4. **Tests** : Vérifier que tout fonctionne toujours
5. **Commit** : `git commit -m "refactor(scope): improve structure"`

## Bonnes pratiques

### Code

- ✅ **Commits fréquents** : Sauvegarder régulièrement
- ✅ **Messages clairs** : Descriptions explicites
- ✅ **Tests en parallèle** : Ne pas les laisser pour la fin
- ✅ **Documentation** : Mettre à jour si nécessaire

### Git

- ✅ **Branches courtes** : Une branche = une feature
- ✅ **Merges propres** : Résoudre les conflits proprement
- ✅ **History claire** : Commits logiques et organisés

### Tests

- ✅ **Smoke tests d'abord** : Vérifier que ça rend
- ✅ **Tests incrémentaux** : Ajouter au fur et à mesure
- ✅ **Maintenir les tests** : Les mettre à jour avec le code

## Outils recommandés

### Développement

- **VS Code** : Éditeur recommandé
- **React DevTools** : Extension navigateur
- **Vitest UI** : Interface pour les tests

### Git

- **GitHub Desktop** : Interface graphique (optionnel)
- **Git CLI** : Ligne de commande (recommandé)

### Tests

- **Vitest UI** : `pnpm test --ui`
- **Coverage** : `pnpm test --coverage`

## Checklist avant de merger

- [ ] Tous les tests passent (`pnpm test`)
- [ ] Le build fonctionne (`pnpm build`)
- [ ] Pas d'erreurs de lint (`pnpm lint`)
- [ ] Documentation à jour (README, docs/)
- [ ] Variables d'environnement documentées
- [ ] Code review effectué (si applicable)
- [ ] Screenshots ajoutés (si changement UI)

## Exemples de workflows

### Exemple 1 : Ajouter une feature simple

```bash
# 1. Créer la branche
git checkout -b feat/refresh-button

# 2. Développer
# ... code ...

# 3. Tester
pnpm test
pnpm build

# 4. Commit
git add .
git commit -m "feat(weather): add manual refresh button"

# 5. Push
git push origin feat/refresh-button

# 6. Créer PR sur GitHub
# 7. Merger après review
```

### Exemple 2 : Corriger un bug

```bash
# 1. Créer test qui reproduit le bug
git checkout -b fix/todo-deadline-bug

# 2. Écrire le test (échoue)
# ... test ...

# 3. Fixer le bug
# ... code ...

# 4. Vérifier que le test passe
pnpm test

# 5. Commit
git commit -m "fix(todo): correct deadline calculation"

# 6. Push et PR
```

## Automatisation

### GitHub Actions (à venir)

- ✅ Tests automatiques sur chaque PR
- ✅ Build automatique
- ✅ Lint automatique
- ✅ Déploiement automatique (optionnel)

### Hooks Git (optionnel)

- Pre-commit : Lint automatique
- Pre-push : Tests automatiques

## Support

Pour toute question sur le workflow :
- 📖 Lire la [documentation de développement](./DEVELOPMENT.md)
- 💬 Demander sur [GitHub Discussions](https://github.com/Mars375/dashboard-personnel/discussions)
- 🐛 Signaler un problème sur [GitHub Issues](https://github.com/Mars375/dashboard-personnel/issues)

