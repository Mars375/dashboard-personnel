# 🚀 Déploiement sur Vercel

Ce guide explique comment déployer le Dashboard Personnel sur Vercel.

## 📋 Prérequis

1. Un compte Vercel (gratuit)
2. Un compte GitHub avec le repository du projet
3. Les variables d'environnement configurées

## 🔧 Configuration

### 1. Variables d'environnement

Dans le dashboard Vercel, ajoutez les variables d'environnement suivantes :

#### OAuth Google
- `VITE_GOOGLE_CLIENT_ID` : ID client Google OAuth
- `GOOGLE_CLIENT_SECRET` : Secret client Google (pour le backend proxy)
- `VITE_OAUTH_PROXY_URL` : URL du proxy OAuth (optionnel, par défaut utilise l'origine)

#### API Météo
- `VITE_OPENWEATHER_API_KEY` : Clé API OpenWeatherMap

#### API Bourse (optionnel)
- `VITE_ALPHA_VANTAGE_API_KEY` : Clé API Alpha Vantage

#### Autres
- `VITE_NOTION_API_KEY` : Clé API Notion (optionnel)
- `VITE_NOTION_DATABASE_ID` : ID de la base de données Notion (optionnel)

### 2. Configuration Vercel

Le fichier `vercel.json` est déjà configuré avec :
- Build command : `pnpm build`
- Output directory : `dist`
- Framework : Vite
- Rewrites pour le routing SPA
- Headers de cache pour les assets statiques

### 3. Déploiement

#### Option 1 : Via l'interface Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Importez votre repository GitHub
4. Vercel détectera automatiquement Vite
5. Ajoutez les variables d'environnement
6. Cliquez sur "Deploy"

#### Option 2 : Via la CLI Vercel

```bash
# Installer la CLI Vercel
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

## 🔄 Déploiement automatique

Vercel déploiera automatiquement :
- À chaque push sur `main` → Production
- À chaque push sur une autre branche → Preview

## 📝 Notes importantes

### Backend Proxy OAuth

Pour le développement local, le proxy OAuth tourne sur `localhost:3001`. En production sur Vercel, vous avez deux options :

1. **Utiliser un backend séparé** : Déployez le serveur Express (`server/oauth-proxy.ts`) sur un autre service (Railway, Render, etc.) et configurez `VITE_OAUTH_PROXY_URL`

2. **Utiliser des Serverless Functions** : Créez des fonctions serverless Vercel pour gérer l'échange de tokens OAuth

### Build optimisé

Le build est optimisé avec :
- Code splitting automatique
- Chunks vendor séparés
- Minification ESBuild
- Cache des assets statiques

## 🐛 Dépannage

### Build échoue

- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez les logs de build dans Vercel
- Testez le build localement : `pnpm build`

### Erreurs OAuth

- Vérifiez que les URLs de redirection OAuth sont configurées dans Google Console
- Vérifiez que `VITE_OAUTH_PROXY_URL` pointe vers le bon endpoint

### Assets non chargés

- Vérifiez que les chemins des assets sont corrects
- Vérifiez les headers de cache dans `vercel.json`

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vite](https://vitejs.dev)
- [Documentation OAuth Setup](./OAUTH_SETUP.md)

