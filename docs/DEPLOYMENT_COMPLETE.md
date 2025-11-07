# 🚀 Guide de Déploiement Complet - Dashboard Personnel

Ce guide vous explique comment déployer le Dashboard Personnel sur Vercel (frontend) et le serveur OAuth proxy sur un service gratuit (backend).

## 📋 Vue d'ensemble

Le projet nécessite deux déploiements :

1. **Frontend** : Application React sur Vercel (gratuit)
2. **Backend** : Serveur Express OAuth proxy sur Railway/Render (gratuit)

## 🎯 Étape 1 : Déployer le Backend OAuth Proxy (Gratuit)

### Option A : Railway (Recommandé) ⭐

Railway offre un plan gratuit généreux (500 heures/mois).

#### 1. Créer un compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Connectez-vous avec GitHub
3. Cliquez sur "New Project"

#### 2. Déployer depuis GitHub

1. Sélectionnez "Deploy from GitHub repo"
2. Choisissez le repository `dashboard-personnel`
3. Railway détectera automatiquement le projet

#### 3. Configurer le service

1. Railway créera un service, mais il faut le configurer pour le backend
2. Dans les settings du service :
   - **Root Directory** : `/` (laisser vide)
   - **Build Command** : `pnpm install`
   - **Start Command** : `pnpm --filter . dev:server` ou créer un script dédié

#### 4. Créer un script de démarrage pour production

Créez un fichier `server/start.ts` :

```typescript
// server/start.ts
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuré pour accepter toutes les origines en production
app.use(
	cors({
		origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
		credentials: true,
	})
);
app.use(express.json());

// Endpoint pour échanger le code OAuth Google contre des tokens
app.post("/api/oauth/exchange", async (req, res) => {
	// ... (copier le code de oauth-proxy.ts)
});

// Endpoint pour rafraîchir les tokens
app.post("/api/oauth/refresh", async (req, res) => {
	// ... (copier le code de oauth-proxy.ts)
});

app.listen(PORT, () => {
	console.log(`🚀 OAuth Proxy Server running on port ${PORT}`);
});
```

#### 5. Ajouter un script dans package.json

```json
{
	"scripts": {
		"start:server": "tsx server/start.ts"
	}
}
```

#### 6. Variables d'environnement Railway

Dans Railway, ajoutez ces variables :

- `VITE_GOOGLE_CLIENT_ID` : Votre ID client Google
- `GOOGLE_CLIENT_SECRET` : Votre secret client Google
- `PORT` : `3001` (ou laisser Railway gérer)
- `ALLOWED_ORIGINS` : URL de votre frontend Vercel (ex: `https://votre-app.vercel.app`)

#### 7. Obtenir l'URL du backend

Railway vous donnera une URL comme : `https://votre-projet.up.railway.app`

**Notez cette URL**, vous en aurez besoin pour le frontend.

---

### Option B : Render (Alternative Gratuite)

Render offre aussi un plan gratuit (limité mais suffisant).

#### 1. Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Connectez-vous avec GitHub
3. Cliquez sur "New +" → "Web Service"

#### 2. Connecter le repository

1. Sélectionnez votre repository `dashboard-personnel`
2. Configurez :
   - **Name** : `dashboard-oauth-proxy`
   - **Environment** : `Node`
   - **Build Command** : `pnpm install`
   - **Start Command** : `pnpm start:server`
   - **Plan** : Free

#### 3. Variables d'environnement

Ajoutez les mêmes variables que Railway.

#### 4. Obtenir l'URL

Render vous donnera une URL comme : `https://dashboard-oauth-proxy.onrender.com`

---

## 🎯 Étape 2 : Déployer le Frontend sur Vercel

### 1. Préparer le projet

Le projet est déjà configuré avec `vercel.json`. Vérifiez que le fichier existe.

### 2. Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez sur "Add New..." → "Project"

### 3. Importer le repository

1. Sélectionnez `dashboard-personnel`
2. Vercel détectera automatiquement Vite
3. Vérifiez la configuration :
   - **Framework Preset** : Vite
   - **Build Command** : `pnpm build`
   - **Output Directory** : `dist`
   - **Install Command** : `pnpm install`

### 4. Variables d'environnement Vercel

Dans les settings du projet Vercel, ajoutez :

#### OAuth Google

```
VITE_GOOGLE_CLIENT_ID=votre-client-id
VITE_OAUTH_PROXY_URL=https://votre-backend.railway.app
```

#### API Météo

```
VITE_OPENWEATHER_API_KEY=votre-cle-api
```

#### API Bourse (optionnel)

```
VITE_ALPHA_VANTAGE_API_KEY=votre-cle-api
```

#### Autres (optionnel)

```
VITE_NOTION_API_KEY=votre-cle-api
VITE_NOTION_DATABASE_ID=votre-database-id
```

**⚠️ IMPORTANT** : Ne mettez PAS `GOOGLE_CLIENT_SECRET` dans Vercel, il doit rester uniquement dans le backend !

### 5. Déployer

1. Cliquez sur "Deploy"
2. Attendez la fin du build (2-3 minutes)
3. Vercel vous donnera une URL : `https://votre-app.vercel.app`

### 6. Configurer les URLs de redirection OAuth

Dans [Google Cloud Console](https://console.cloud.google.com) :

1. Allez dans "APIs & Services" → "Credentials"
2. Modifiez votre OAuth 2.0 Client ID
3. Ajoutez dans "Authorized redirect URIs" :
   - `https://votre-app.vercel.app/oauth/google/callback`
   - `http://localhost:5173/oauth/google/callback` (pour le dev local)

---

## 🔄 Étape 3 : Mettre à jour le Backend avec l'URL du Frontend

Retournez dans Railway/Render et mettez à jour la variable `ALLOWED_ORIGINS` :

```
ALLOWED_ORIGINS=https://votre-app.vercel.app,http://localhost:5173
```

Redéployez le backend si nécessaire.

---

## ✅ Vérification

1. **Frontend** : Visitez `https://votre-app.vercel.app`
2. **Backend** : Testez `https://votre-backend.railway.app/api/oauth/exchange` (devrait retourner une erreur 400, c'est normal)
3. **OAuth** : Essayez de vous connecter avec Google dans l'application

---

## 🆓 Coûts

- **Vercel** : Gratuit (illimité pour les projets personnels)
- **Railway** : Gratuit (500 heures/mois, suffisant pour un usage personnel)
- **Render** : Gratuit (limité mais fonctionnel)

---

## 🔧 Dépannage

### Erreur CORS

- Vérifiez que `ALLOWED_ORIGINS` dans le backend contient l'URL exacte du frontend
- Vérifiez que le backend accepte les requêtes depuis le frontend

### Erreur OAuth

- Vérifiez que les URLs de redirection sont correctes dans Google Console
- Vérifiez que `VITE_OAUTH_PROXY_URL` pointe vers le bon backend
- Vérifiez les logs du backend (Railway/Render)

### Build échoue sur Vercel

- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez les logs de build dans Vercel
- Testez le build localement : `pnpm build`

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Railway](https://docs.railway.app)
- [Documentation Render](https://render.com/docs)
- [Documentation OAuth Setup](./OAUTH_SETUP.md)

---

## 🎉 Félicitations !

Votre Dashboard Personnel est maintenant déployé et accessible publiquement ! 🚀
