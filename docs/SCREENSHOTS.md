# 📸 Screenshots et visuels

## Guide pour ajouter des screenshots

Ce document explique comment ajouter des screenshots à la documentation du projet.

## Où placer les screenshots

Créer un dossier `docs/screenshots/` :

```
docs/
├── screenshots/
│   ├── weather-widget.png
│   ├── todo-widget.png
│   ├── dashboard-overview.png
│   └── mobile-view.png
└── ...
```

## Recommandations

### Format

- **Format** : PNG (meilleure qualité) ou WebP (plus léger)
- **Taille** : Maximum 1920x1080 (Full HD)
- **Nommage** : `kebab-case.png` (ex: `weather-widget.png`)

### Contenu

Prendre des screenshots de :
- Vue d'ensemble du dashboard
- Chaque widget individuellement
- États spécifiques (loading, error, empty)
- Fonctionnalités importantes
- Vue mobile (responsive)

### Qualité

- **Bon contraste** : Légendes lisibles
- **Focus clair** : Mettre en évidence ce qui est important
- **Anonymiser** : Pas de données personnelles sensibles

## Ajouter dans le README

```markdown
## 📸 Screenshots

### Vue d'ensemble
![Dashboard Overview](./docs/screenshots/dashboard-overview.png)

### Weather Widget
![Weather Widget](./docs/screenshots/weather-widget.png)

### Todo Widget
![Todo Widget](./docs/screenshots/todo-widget.png)
```

## Ajouter dans la documentation

### Dans docs/WIDGETS.md

```markdown
## Weather Widget 🌤️

![Weather Widget](./screenshots/weather-widget.png)

### Fonctionnalités
- ...
```

### Dans docs/GETTING_STARTED.md

```markdown
## Utilisation

### Weather Widget

1. Rechercher une ville :
   ![Search city](./screenshots/weather-search.png)
```

## Outils recommandés

### Capture d'écran

- **Windows** : Snip & Sketch, Snipping Tool
- **macOS** : Cmd+Shift+4
- **Linux** : Flameshot, Spectacle

### Édition

- **Lightweight** : GIMP, Paint.NET
- **Online** : Photopea, Canva
- **Professional** : Photoshop, Figma

### Compression

- **TinyPNG** : Compresser les PNG sans perte de qualité
- **Squoosh** : Compression optimale WebP/PNG

## Checklist pour screenshots

- [ ] Format PNG ou WebP
- [ ] Taille raisonnable (< 500 KB idéalement)
- [ ] Nommage clair (`kebab-case`)
- [ ] Placer dans `docs/screenshots/`
- [ ] Référencer dans README ou docs/
- [ ] Bon contraste et lisibilité
- [ ] Aucune donnée personnelle sensible

## Exemples de screenshots à prendre

### Vue d'ensemble
- Dashboard complet avec les deux widgets
- Vue desktop et mobile

### Weather Widget
- État vide (message d'invitation)
- État chargement (skeleton)
- État erreur (message d'erreur)
- État succès (météo affichée)
- Prévisions 5 jours
- Autocomplétion (popover ouvert)

### Todo Widget
- État vide ("Aucune tâche")
- Liste avec tâches
- Filtres actifs
- Statistiques (graphiques)
- Multi-listes (dropdown)
- Dialog de suppression
- Import/Export

### Fonctionnalités
- Notifications (permission)
- Synchronisation (bouton)
- Drag & drop (état actif)
- Undo/Redo (tooltip)

## Workflow recommandé

1. **Développer** la feature complètement
2. **Tester** que tout fonctionne
3. **Prendre** les screenshots nécessaires
4. **Optimiser** (compression si nécessaire)
5. **Ajouter** dans `docs/screenshots/`
6. **Référencer** dans la documentation
7. **Commit** : `git commit -m "docs: add screenshots"`

## Maintenance

### Quand mettre à jour

- ✅ Nouvelle feature ajoutée (nouveau screenshot)
- ✅ UI modifiée (screenshot obsolète à remplacer)
- ✅ Nouveau widget ajouté

### Nettoyage

- Supprimer les screenshots obsolètes
- Garder uniquement les plus pertinents
- Compresser si trop volumineux

## Ressources

### Outils en ligne

- **TinyPNG** : https://tinypng.com/
- **Squoosh** : https://squoosh.app/
- **Photopea** : https://www.photopea.com/

### Documentation

- **Markdown images** : https://www.markdownguide.org/basic-syntax/#images
- **Git LFS** (si gros fichiers) : https://git-lfs.github.com/

