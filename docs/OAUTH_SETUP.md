# 🔐 Guide de configuration OAuth

Ce guide explique comment configurer l'authentification OAuth pour les différents providers (Google, Microsoft, Notion) dans le Dashboard Personnel.

## 📋 Vue d'ensemble

L'architecture OAuth est centralisée dans `src/lib/auth/` et gère :
- **Google** : Calendar et Tasks
- **Microsoft** : Outlook Calendar
- **Notion** : API

## 🚀 Configuration rapide

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=votre_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=votre_microsoft_client_id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/oauth/microsoft/callback
VITE_MICROSOFT_TENANT=common

# Notion OAuth
VITE_NOTION_CLIENT_ID=votre_notion_client_id
VITE_NOTION_REDIRECT_URI=http://localhost:5173/oauth/notion/callback
```

### 2. Configuration Google

#### Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs nécessaires :
   - Google Calendar API
   - Google Tasks API (si nécessaire)
4. Allez dans **APIs & Services** > **Credentials**
5. Cliquez sur **Create Credentials** > **OAuth client ID**
6. Configurez l'application :
   - **Application type** : Web application
   - **Name** : Dashboard Personnel
   - **Authorized redirect URIs** : 
     - `http://localhost:5173/oauth/google/callback` (dev)
     - `https://votre-domaine.com/oauth/google/callback` (prod)
7. Copiez le **Client ID** dans `.env.local`

#### Scopes nécessaires

- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/tasks` (si nécessaire)

### 3. Configuration Microsoft

#### Azure AD

1. Allez sur [Azure Portal](https://portal.azure.com/)
2. Créez une nouvelle **App Registration**
3. Configurez :
   - **Name** : Dashboard Personnel
   - **Supported account types** : Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI** :
     - Type : Web
     - URI : `http://localhost:5173/oauth/microsoft/callback` (dev)
4. Allez dans **API permissions** et ajoutez :
   - `User.Read`
   - `Calendars.ReadWrite`
   - `offline_access`
5. Allez dans **Certificates & secrets** et créez un **Client Secret** (optionnel pour OAuth implicit flow)
6. Copiez le **Application (client) ID** dans `.env.local`

#### Tenant

- `common` : Tous les comptes Microsoft (recommandé)
- `organizations` : Uniquement les comptes professionnels
- `consumers` : Uniquement les comptes personnels

### 4. Configuration Notion

#### Notion Integration

1. Allez sur [Notion Integrations](https://www.notion.so/my-integrations)
2. Cliquez sur **+ New integration**
3. Configurez :
   - **Name** : Dashboard Personnel
   - **Associated workspace** : Votre workspace
4. Copiez le **Internal Integration Token** (c'est votre Client ID)
5. Partagez vos bases Notion avec l'intégration
6. Ajoutez le token dans `.env.local`

**Note** : Notion utilise une API key plutôt qu'un flow OAuth complet. L'architecture supporte les deux approches.

## 🔧 Utilisation dans le code

### Exemple basique

```typescript
import { getOAuthManager } from "@/lib/auth/oauthManager";

const manager = getOAuthManager();

// Connecter à Google Calendar
try {
  const connection = await manager.connect("google", "google-calendar");
  console.log("Connecté !", connection.user);
} catch (error) {
  console.error("Erreur:", error);
}

// Vérifier si connecté
const isConnected = manager.isConnected("google");

// Obtenir un token valide (rafraîchit si nécessaire)
const accessToken = await manager.getValidAccessToken("google");

// Déconnecter
await manager.disconnect("google");
```

### Composant React

```typescript
import { OAuthButton } from "@/components/ui/oauth-button";

<OAuthButton
  provider="google"
  service="google-calendar"
  onConnect={() => console.log("Connecté !")}
  onDisconnect={() => console.log("Déconnecté !")}
/>
```

## 🔄 Flux OAuth

### 1. Popup flow (recommandé)

```typescript
const manager = getOAuthManager();
await manager.connect("google", "google-calendar");
```

Le flux :
1. Ouvre une popup OAuth
2. Utilisateur s'authentifie
3. Redirection vers `/oauth/google/callback`
4. Le callback envoie un message au parent
5. La popup se ferme automatiquement
6. Les tokens sont stockés dans `localStorage`

### 2. Backend proxy (recommandé pour production)

Pour la production, il est recommandé d'implémenter un backend proxy qui :
- Gère l'échange `code` → `tokens` (nécessite `client_secret`)
- Stocke les tokens de manière sécurisée
- Rafraîchit les tokens automatiquement

**Architecture recommandée** :
- Frontend : OAuth popup → Redirection → Envoie `code` au backend
- Backend : Reçoit `code` → Échange contre `tokens` → Stocke dans DB → Retourne `access_token`
- Frontend : Utilise `access_token` pour les appels API

## 🔒 Sécurité

### ⚠️ Limitations actuelles (MVP)

- Tokens stockés dans `localStorage` (non cryptés)
- `client_secret` non utilisé (OAuth implicit flow)
- Pas de backend proxy

### ✅ Recommandations pour la production

1. **Backend API** : Implémenter un backend proxy pour l'échange `code` → `tokens`
2. **Stockage sécurisé** : Stocker les tokens dans une base de données avec chiffrement
3. **HTTPS uniquement** : Utiliser HTTPS en production
4. **Refresh automatique** : Implémenter un service de refresh automatique des tokens
5. **CSP Headers** : Configurer Content Security Policy pour limiter les scripts
6. **Rate limiting** : Limiter les tentatives de connexion

## 🐛 Dépannage

### Popup bloquée

Si la popup est bloquée, vérifiez :
- Les paramètres du navigateur (autorisation des popups)
- Les bloqueurs de publicité
- Les extensions de navigateur

### Erreur "redirect_uri_mismatch"

Vérifiez que l'URI de redirection dans `.env.local` correspond exactement à celle configurée dans :
- Google Cloud Console
- Azure AD
- Notion

### Token expiré

Les tokens sont automatiquement rafraîchis si un `refresh_token` est disponible. Sinon, reconnectez-vous.

### CORS errors

Les APIs Google/Microsoft supportent CORS. Si vous rencontrez des erreurs :
- Vérifiez que vous utilisez les bonnes URLs d'API
- Vérifiez les headers `Authorization`
- Vérifiez que le token est valide

## 📚 Ressources

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Graph OAuth](https://learn.microsoft.com/en-us/graph/auth/)
- [Notion API](https://developers.notion.com/)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Outlook Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)

## 🚀 Démarrage Rapide

### Configuration Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez un projet existant
3. Activez **Google Calendar API** et **Google Tasks API**
4. Allez dans **APIs & Services** > **Credentials**
5. Cliquez sur **Create Credentials** > **OAuth client ID**
6. Configurez :
   - **Application type** : Web application
   - **Name** : Dashboard Personnel
   - **Authorized redirect URIs** : 
     - `http://localhost:5173/oauth/google/callback` (dev)
     - `https://votre-domaine.com/oauth/google/callback` (prod)
7. Copiez le **Client ID** et le **Client Secret**

#### Passer l'application en mode Production

**⚠️ IMPORTANT** : Pour que n'importe qui puisse se connecter (pas seulement les test users), vous devez passer l'application en mode **"Production"**.

1. Allez dans **APIs & Services** → **OAuth consent screen**
2. Vérifiez que les informations sont complètes :
   - **App name** : Dashboard Personnel
   - **User support email** : Votre email
   - **Developer contact information** : Votre email
   - **Scopes** : Les scopes nécessaires (Calendar, Tasks, etc.)
3. En bas de la page, cliquez sur **"PUBLISH APP"** ou **"SAVE AND CONTINUE"** jusqu'à voir le bouton **"BACK TO DASHBOARD"**
4. Si vous voyez un avertissement de vérification, vous avez deux options :

   **Option A : Mode Production sans vérification (pour usage personnel)**
   - Si vous utilisez uniquement des scopes non sensibles (Calendar, Tasks)
   - Google peut vous permettre de publier sans vérification
   - Cliquez sur **"PUBLISH APP"** et confirmez
   - L'application sera accessible publiquement

   **Option B : Demander la vérification (pour usage public)**
   - Si Google demande une vérification, suivez le processus
   - Cela peut prendre quelques jours
   - En attendant, vous pouvez ajouter des "Test users" dans **OAuth consent screen** → **Test users**

**Note** : En mode "Test", seuls les utilisateurs ajoutés comme "Test users" peuvent se connecter. En mode "Production", n'importe qui peut se connecter.

### Configuration locale

Créez un fichier `.env.local` à la racine du projet :

```env
# Client ID (peut être exposé)
VITE_GOOGLE_CLIENT_ID=votre_google_client_id_ici
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback

# Client Secret (DOIT rester secret - pas de préfixe VITE_)
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
```

### Lancer l'application

**Option A : Lancer les deux serveurs séparément**

**Terminal 1 - Frontend :**
```bash
pnpm dev
```

**Terminal 2 - Backend proxy OAuth :**
```bash
pnpm dev:server
```

**Option B : Lancer les deux en même temps**
```bash
pnpm dev:all
```

L'application sera accessible sur `http://localhost:5173`  
Le backend proxy sera sur `http://localhost:3001`

### Tester la connexion

1. Ouvrez le Calendar Widget en mode **Full**
2. Cliquez sur **"Se connecter à Google Calendar"**
3. Une popup OAuth devrait s'ouvrir
4. Connectez-vous et autorisez l'accès
5. La popup se ferme automatiquement
6. Le bouton change pour "Déconnecter Google"
7. Cliquez sur **Synchroniser** pour récupérer les événements

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URI dans `.env.local` correspond **exactement** à celle dans Google Cloud Console
- L'URI doit être identique, y compris le protocole (http/https) et le port

### Erreur "Le backend proxy OAuth n'est pas démarré"
- Assurez-vous que le backend proxy est lancé : `pnpm dev:server`
- Vérifiez que le port 3001 n'est pas déjà utilisé

### Erreur "GOOGLE_CLIENT_SECRET manquant"
- Vérifiez que `GOOGLE_CLIENT_SECRET` est dans `.env.local` (sans préfixe `VITE_`)
- Redémarrez le serveur backend après ajout

### Application en mode "Test" dans Google Cloud Console

Si vous obtenez une erreur lors de la connexion Google, vérifiez le mode de l'application :

1. Allez dans **APIs & Services** → **OAuth consent screen**
2. Vérifiez le statut en haut de la page :
   - **"Testing"** : Seuls les test users peuvent se connecter
   - **"In production"** : N'importe qui peut se connecter

**Pour passer en Production :**
- Cliquez sur **"PUBLISH APP"** en bas de la page
- Confirmez la publication
- Si Google demande une vérification, suivez le processus ou ajoutez des test users en attendant

**Pour ajouter des test users (mode Testing) :**
- Dans **OAuth consent screen** → **Test users**
- Cliquez sur **"+ ADD USERS"**
- Ajoutez les emails des utilisateurs autorisés

