# 🔧 Configuration du backend proxy OAuth

## 📋 Prérequis

Le backend proxy OAuth est nécessaire pour échanger le `code` OAuth contre des `tokens` (car le `client_secret` ne doit pas être exposé côté client).

## 🚀 Installation

Les dépendances sont déjà installées. Si besoin :

```bash
pnpm install
```

## ⚙️ Configuration

### 1. Obtenir le Client Secret Google

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID**
5. Copiez le **Client Secret** (pas juste le Client ID)

### 2. Ajouter au `.env.local`

Ajoutez le **Client Secret** dans votre fichier `.env.local` :

```env
# Variables déjà existantes
VITE_GOOGLE_CLIENT_ID=votre_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback

# NOUVELLE VARIABLE - IMPORTANT : SANS le préfixe VITE_
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
```

**⚠️ Important** : Le `GOOGLE_CLIENT_SECRET` ne doit **PAS** avoir le préfixe `VITE_` car :
- Les variables `VITE_*` sont exposées au frontend (pas sécurisé pour les secrets)
- Le `GOOGLE_CLIENT_SECRET` doit rester côté serveur uniquement

## 🎯 Utilisation

### Option 1 : Lancer séparément

**Terminal 1 - Frontend :**
```bash
pnpm dev
```

**Terminal 2 - Backend proxy :**
```bash
pnpm dev:server
```

### Option 2 : Lancer les deux ensemble

```bash
pnpm dev:all
```

Cela lance automatiquement le frontend (port 5173) et le backend proxy (port 3001).

## ✅ Vérification

1. Le backend devrait démarrer sur `http://localhost:3001`
2. Vous devriez voir : `🚀 OAuth Proxy démarré sur http://localhost:3001`
3. L'endpoint est disponible à : `http://localhost:3001/api/oauth/exchange`

## 🧪 Test

1. Assurez-vous que le backend est démarré
2. Connectez-vous via le bouton OAuth dans le Calendar Widget
3. La connexion devrait maintenant fonctionner complètement !

## 🐛 Dépannage

### Erreur "GOOGLE_CLIENT_SECRET manquant"
- Vérifiez que `GOOGLE_CLIENT_SECRET` est dans `.env.local`
- Vérifiez qu'il n'a **PAS** le préfixe `VITE_`
- Redémarrez le serveur backend

### Erreur "fetch failed"
- Vérifiez que le backend est démarré (`pnpm dev:server`)
- Vérifiez qu'il est sur le port 3001
- Vérifiez les logs du backend pour les erreurs

### Erreur CORS
- Le backend est configuré pour accepter les requêtes depuis `http://localhost:5173`
- Si vous utilisez un autre port, modifiez `cors({ origin: "..." })` dans `server/oauth-proxy.ts`

