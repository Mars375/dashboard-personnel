# 🤝 Guide de contribution

## Bienvenue !

Merci de votre intérêt pour contribuer au Dashboard Personnel ! Ce document décrit comment contribuer efficacement au projet.

## Comment contribuer

### Signaler un bug

1. Vérifier que le bug n'a pas déjà été signalé dans [GitHub Issues](https://github.com/Mars375/dashboard-personnel/issues)
2. Créer une nouvelle issue avec :
   - **Titre clair** : Description concise du problème
   - **Description détaillée** : Étapes pour reproduire
   - **Comportement attendu** : Ce qui devrait se passer
   - **Comportement actuel** : Ce qui se passe vraiment
   - **Screenshots** : Si applicable
   - **Environnement** : OS, navigateur, version Node

### Proposer une feature

1. Vérifier que la feature n'a pas déjà été proposée
2. Créer une issue avec :
   - **Titre clair** : Description de la feature
   - **Description** : Cas d'usage et bénéfices
   - **Exemples** : Si applicable
   - **Mockups** : Si changement UI (optionnel)

### Soumettre une Pull Request

1. **Fork** le repository
2. **Cloner** votre fork :
   ```bash
   git clone https://github.com/VOTRE_USERNAME/dashboard-personnel.git
   cd dashboard-personnel
   ```

3. **Créer une branche** :
   ```bash
   git checkout -b feat/ma-feature
   ```

4. **Développer** :
   - Suivre les [bonnes pratiques](./DEVELOPMENT.md)
   - Ajouter des tests
   - Mettre à jour la documentation si nécessaire

5. **Tester** :
   ```bash
   pnpm test
   pnpm build
   pnpm lint
   ```

6. **Commit** :
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

7. **Push** :
   ```bash
   git push origin feat/ma-feature
   ```

8. **Créer une Pull Request** sur GitHub

## Standards de code

### TypeScript

- Utiliser les types partout
- Éviter `any` (utiliser `unknown` si nécessaire)
- Nommer les types explicitement

### React

- Composants fonctionnels (pas de classes)
- Hooks personnalisés pour la logique réutilisable
- Props typées avec interfaces

### Naming

- **Composants** : `PascalCase`
- **Hooks** : `camelCase` avec préfixe `use`
- **Fonctions** : `camelCase`
- **Constantes** : `UPPER_SNAKE_CASE`
- **Types** : `PascalCase`

### Formatage

- Utiliser Prettier (si configuré)
- Indentation : 2 espaces
- Ligne maximale : 100 caractères (guideline)

## Tests

### Règle d'or

**Ne pas commit sans tests !**

### Types de tests à ajouter

1. **Smoke tests** : Vérifier que ça rend
2. **Unit tests** : Tester la logique isolée
3. **Integration tests** : Tester les interactions
4. **E2E-like tests** : Tester les scénarios utilisateur

### Structure des tests

```typescript
describe("Component", () => {
  it("should do X when Y", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Documentation

### Quand mettre à jour

- ✅ Nouvelle feature ajoutée
- ✅ API modifiée
- ✅ Workflow changé
- ✅ Configuration modifiée

### Où documenter

- **README.md** : Vue d'ensemble et quick start
- **docs/DEVELOPMENT.md** : Guide de développement
- **docs/API.md** : API et intégrations
- **docs/WIDGETS.md** : Documentation des widgets
- **Code comments** : Documentation inline pour logique complexe

## Processus de review

### Attendre une review

1. Créer la PR
2. Remplir le template de PR
3. Attendre les commentaires
4. Adresser les commentaires si nécessaire
5. Après approbation, merger

### Adresser les commentaires

- Répondre à chaque commentaire
- Faire les modifications demandées
- Re-push sur la même branche
- La PR se met à jour automatiquement

## Checklist avant de soumettre

- [ ] Code fonctionne localement
- [ ] Tous les tests passent (`pnpm test`)
- [ ] Le build fonctionne (`pnpm build`)
- [ ] Pas d'erreurs de lint (`pnpm lint`)
- [ ] Documentation à jour
- [ ] Tests ajoutés si nouvelle feature
- [ ] Pas de console.log oubliés
- [ ] Code commenté si nécessaire

## Questions ?

Si vous avez des questions :
- 📖 Lire la [documentation complète](./README.md)
- 💬 Demander sur [GitHub Discussions](https://github.com/Mars375/dashboard-personnel/discussions)
- 🐛 Signaler un problème sur [GitHub Issues](https://github.com/Mars375/dashboard-personnel/issues)

## Code of Conduct

### Comportement attendu

- ✅ Respect mutuel
- ✅ Critique constructive
- ✅ Ouverture aux idées nouvelles
- ✅ Accueil des débutants

### Comportement à éviter

- ❌ Langage offensant
- ❌ Commentaires personnels
- ❌ Critique négative non constructive
- ❌ Harassement sous quelque forme que ce soit

## Remerciements

Merci de contribuer au Dashboard Personnel ! 🎉

Vos contributions rendent ce projet meilleur pour tous.

