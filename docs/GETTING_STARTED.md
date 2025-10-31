# 🚀 Guide de démarrage

## Installation rapide

### 1. Cloner le projet

```bash
git clone https://github.com/Mars375/dashboard-personnel.git
cd dashboard-personnel
```

### 2. Installer les dépendances

```bash
pnpm install
```

Si vous n'avez pas pnpm :
```bash
npm install -g pnpm
# ou
curl -fsSL https://get.pnpm.io/install.sh | sh
```

### 3. Configurer l'API OpenWeatherMap

Créer un fichier `.env.local` à la racine :

```env
VITE_OPENWEATHER_API_KEY=votre_cle_api_ici
```

Pour obtenir une clé API :
1. Aller sur [OpenWeatherMap](https://openweathermap.org/api)
2. Créer un compte gratuit
3. Générer une clé API
4. Copier la clé dans `.env.local`

### 4. Lancer l'application

```bash
pnpm dev
```

Ouvrir [http://localhost:5173](http://localhost:5173) dans votre navigateur.

## Utilisation

### Weather Widget

1. **Rechercher une ville** :
   - Taper le nom dans le champ de recherche
   - Les suggestions apparaissent automatiquement
   - Cliquer ou appuyer sur Enter pour sélectionner

2. **Voir la météo** :
   - Température actuelle
   - Description (ensoleillé, nuageux, etc.)
   - Min/Max du jour
   - Prévisions sur 5 jours

3. **Rafraîchir** :
   - Bouton "Rafraîchir" manuel
   - Auto-refresh toutes les 10 minutes

### Todo Widget

1. **Ajouter une tâche** :
   - Taper dans le champ "Nouvelle tâche"
   - Appuyer sur Enter

2. **Gérer les tâches** :
   - ✅ Cocher pour marquer comme terminée
   - ⭐ Cliquer sur l'étoile pour prioriser
   - ✏️ Double-clic pour éditer
   - 🗑️ Bouton supprimer

3. **Filtrer** :
   - Tous / Actives / Terminées / Prioritaires
   - Barre de recherche pour filtrer par texte

4. **Multi-listes** :
   - Créer plusieurs listes (Pro, Perso, etc.)
   - Switcher entre les listes
   - Gérer (renommer, supprimer)

5. **Deadlines** :
   - Ajouter une date limite
   - Badge "en retard" si dépassée
   - Notifications automatiques

6. **Import/Export** :
   - Exporter en JSON pour backup
   - Importer depuis un fichier JSON
   - Drag & drop supporté

7. **Statistiques** :
   - Barre de progression
   - Graphiques visuels (pie charts)
   - Compteurs de tâches

8. **Synchronisation** :
   - Bouton de sync pour Notion/Google Tasks
   - Configuration dans les paramètres

## Personnalisation

### Ajouter un nouveau widget

Voir [docs/DEVELOPMENT.md](./DEVELOPMENT.md#architecture-des-widgets)

### Modifier le style

Les styles utilisent Tailwind CSS. Personnaliser dans :
- `src/index.css` : Variables CSS globales
- `src/App.css` : Styles spécifiques à l'app

### Changer les couleurs

Modifier les variables CSS dans `src/index.css` :

```css
:root {
  --primary: /* votre couleur */;
  --background: /* votre couleur */;
  /* etc. */
}
```

## Dépannage

### L'application ne se charge pas

1. Vérifier que toutes les dépendances sont installées :
   ```bash
   pnpm install
   ```

2. Vérifier la console du navigateur pour les erreurs

3. Nettoyer et réinstaller :
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### La météo ne s'affiche pas

1. Vérifier que la clé API est bien dans `.env.local`
2. Vérifier que le fichier `.env.local` est à la racine du projet
3. Redémarrer le serveur de dev après avoir ajouté la clé
4. Vérifier la console pour les erreurs API

### Les todos ne se sauvegardent pas

1. Vérifier que localStorage est activé dans le navigateur
2. Vérifier qu'il n'y a pas de mode privé
3. Vérifier la console pour les erreurs

### Les tests échouent

```bash
# Réinstaller les dépendances
pnpm install

# Nettoyer le cache Vitest
rm -rf node_modules/.vite

# Relancer les tests
pnpm test
```

## Support

- 📖 Lire la [documentation complète](./README.md)
- 🐛 Signaler un bug : [GitHub Issues](https://github.com/Mars375/dashboard-personnel/issues)
- 💡 Suggérer une feature : [GitHub Discussions](https://github.com/Mars375/dashboard-personnel/discussions)

