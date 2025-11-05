# 🔄 Workflow de Développement

## 📋 Convention de Nommage des Branches

### Format
```
<type>:<description>
```

### Types de Branches

- **`fix:`** - Corrections de bugs et optimisations
  - Exemple : `fix:optimisation-bundle`, `fix:typescript-errors`
  
- **`feat:`** - Nouvelles fonctionnalités et widgets
  - Exemple : `feat:notes-widget`, `feat:habits-widget`
  
- **`refactor:`** - Refactoring de code
  - Exemple : `refactor:calendar-full`, `refactor:google-tasks-sync`
  
- **`docs:`** - Documentation uniquement
  - Exemple : `docs:api-documentation`, `docs:widget-guide`
  
- **`test:`** - Ajout ou amélioration de tests
  - Exemple : `test:coverage-improvement`, `test:e2e-setup`

---

## 🔄 Processus de Développement

### Étape 1 : Création de la Branche
```bash
git checkout -b <type>:<description>
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
git push origin <type>:<description>
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
1. `fix:optimisation-bundle` - Lazy loading Recharts
2. `fix:optimisation-performance` - Memoization et virtualisation
3. `refactor:calendar-full` - Refactoring du composant calendar-full
4. `refactor:google-tasks-sync` - Refactoring du service de sync

### Phase 2 : Nouveaux Widgets (Priorité Moyenne)
1. `feat:notes-widget` - Widget de notes
2. `feat:habits-widget` - Widget de suivi d'habitudes
3. `feat:journal-widget` - Widget de journal
4. `feat:finance-widget` - Widget de finances
5. `feat:pomodoro-widget` - Widget Pomodoro
6. `feat:stats-widget` - Widget de statistiques
7. `feat:rss-widget` - Widget RSS
8. `feat:bookmark-widget` - Widget de favoris
9. `feat:quote-widget` - Widget de citations
10. `feat:graphiques-widget` - Widget de graphiques personnalisés

### Phase 3 : Système Avancé (Priorité Basse)
1. `feat:widget-library` - Système de bibliothèque de widgets
2. `feat:widget-marketplace` - Marketplace de widgets
3. `feat:widget-plugins` - Système de plugins

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

## 📚 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org/)
