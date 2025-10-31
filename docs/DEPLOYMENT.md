# 🚀 Guide de déploiement

## Build de production

```bash
# Créer le build optimisé
pnpm build

# Le build sera dans le dossier dist/
```

Le dossier `dist/` contient :
- `index.html` : Point d'entrée
- `assets/` : JS et CSS minifiés et optimisés

## Déploiement sur Vercel

### Configuration automatique

1. Connecter votre repository GitHub à Vercel
2. Vercel détecte automatiquement Vite
3. Ajouter les variables d'environnement dans les paramètres du projet

### Variables d'environnement à configurer

```
VITE_OPENWEATHER_API_KEY=votre_cle_api
```

### Commandes de build (auto-détectées)

- Build Command : `pnpm build`
- Output Directory : `dist`

## Déploiement sur Netlify

### Configuration

1. Connecter le repository
2. Configurer les paramètres :

```
Build command: pnpm build
Publish directory: dist
```

### Variables d'environnement

Ajouter dans **Site settings > Environment variables**

## Déploiement sur GitHub Pages

### Configuration

1. Installer `gh-pages` :
```bash
pnpm add -D gh-pages
```

2. Ajouter un script dans `package.json` :
```json
{
  "scripts": {
    "deploy": "pnpm build && gh-pages -d dist"
  }
}
```

3. Déployer :
```bash
pnpm deploy
```

### Configuration du repository

Dans **Settings > Pages** :
- Source : `gh-pages` branch
- Folder : `/ (root)`

## Variables d'environnement

### En production

Toutes les variables `VITE_*` sont remplacées au moment du build.

⚠️ **Important** : Les variables d'environnement doivent être définies **avant** le build.

### Sur Vercel/Netlify

1. Aller dans les paramètres du projet
2. Section "Environment Variables"
3. Ajouter chaque variable avec sa valeur

## Optimisations

### Code Splitting

Le build Vite génère automatiquement des chunks séparés pour :
- Chaque widget
- Bibliothèques externes (React, etc.)

### Compression

Les assets sont automatiquement :
- Minifiés
- Gzip/Brotli compressés (par le CDN)
- Hashés pour le cache

### Cache

- Assets hashés : Cache long terme
- `index.html` : Pas de cache (toujours vérifier les mises à jour)

## Vérification du déploiement

Après déploiement, vérifier :

1. ✅ L'application se charge correctement
2. ✅ Les widgets s'affichent
3. ✅ Les appels API fonctionnent (clé API configurée)
4. ✅ localStorage fonctionne
5. ✅ Les tests passent toujours

## Rollback

En cas de problème :

- **Vercel** : Interface UI → Deployments → Rollback
- **Netlify** : Deploys → Options → Publish deploy précédent
- **GitHub Pages** : Revenir à un commit précédent

## Monitoring

### Recommandations

- Configurer des alertes sur les erreurs
- Monitorer les appels API (rate limits)
- Surveiller les performances (Core Web Vitals)

### Analytics (optionnel)

Intégrer Google Analytics ou autre pour :
- Usage des widgets
- Erreurs JavaScript
- Performance

## Checklist de déploiement

Avant de déployer :

- [ ] Tous les tests passent (`pnpm test`)
- [ ] Le build fonctionne (`pnpm build`)
- [ ] Pas d'erreurs de lint (`pnpm lint`)
- [ ] Variables d'environnement configurées
- [ ] README à jour
- [ ] Changelog si nécessaire

