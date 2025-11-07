# 🔧 Correction du redirect_uri OAuth

## ❌ Problème

Quand vous cliquez sur "Connecter Google" sur Vercel, après avoir choisi un compte, vous obtenez l'erreur :
```
localhost n'autorise pas la connexion
```

## 🔍 Cause

Le `redirect_uri` utilisé dans l'URL OAuth pointe vers `localhost` au lieu de l'URL Vercel.

## ✅ Solution

### Option 1 : Ne pas définir `VITE_GOOGLE_REDIRECT_URI` dans Vercel (Recommandé)

Le code utilise automatiquement `window.location.origin` en production, ce qui donnera l'URL Vercel correcte.

**Dans Vercel Dashboard → Settings → Environment Variables :**

1. **Supprimez** la variable `VITE_GOOGLE_REDIRECT_URI` si elle existe
2. Le code utilisera automatiquement : `https://votre-app.vercel.app/oauth/google/callback`

### Option 2 : Définir explicitement l'URL Vercel

Si vous voulez être explicite, ajoutez dans Vercel :

```env
VITE_GOOGLE_REDIRECT_URI=https://dashboard-personnel.vercel.app/oauth/google/callback
```

**⚠️ IMPORTANT :**
- Utilisez l'URL **exacte** de votre application Vercel
- **PAS de slash final** après `/callback`
- L'URL doit correspondre **exactement** à celle dans Google Console

## 📋 Vérification

### 1. Vérifier les variables Vercel

Dans **Vercel Dashboard → Settings → Environment Variables**, vous devriez avoir :

```env
VITE_GOOGLE_CLIENT_ID=votre-client-id
VITE_OAUTH_PROXY_URL=https://dashboard-oauth-proxy.onrender.com
```

**Optionnel :**
```env
VITE_GOOGLE_REDIRECT_URI=https://dashboard-personnel.vercel.app/oauth/google/callback
```

### 2. Vérifier Google Console

Dans [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials** :

L'URL de redirection autorisée doit être :
```
https://dashboard-personnel.vercel.app/oauth/google/callback
```

**⚠️ L'URL doit correspondre EXACTEMENT** (même protocole, même domaine, même chemin, pas de slash final).

### 3. Redéployer

Après modification des variables :
- **Vercel** : Redéploiement automatique ou manuel
- Testez la connexion Google

## 🐛 Comment le code fonctionne

Le code dans `oauthManager.ts` construit le `redirectUri` ainsi :

```typescript
const googleRedirectUri =
    import.meta.env.VITE_GOOGLE_REDIRECT_URI || 
    `${window.location.origin}/oauth/google/callback`;
```

- Si `VITE_GOOGLE_REDIRECT_URI` est défini → utilise cette valeur
- Sinon → utilise `window.location.origin` (qui sera l'URL Vercel en production)

**En production sur Vercel :**
- `window.location.origin` = `https://dashboard-personnel.vercel.app`
- Donc `redirectUri` = `https://dashboard-personnel.vercel.app/oauth/google/callback`

C'est pourquoi il est recommandé de **ne pas définir** `VITE_GOOGLE_REDIRECT_URI` en production, sauf si vous avez besoin d'une URL spécifique différente.

## ✅ Checklist

- [ ] `VITE_GOOGLE_REDIRECT_URI` supprimée de Vercel OU définie avec l'URL Vercel correcte
- [ ] URL de redirection dans Google Console correspond exactement
- [ ] Application Vercel redéployée
- [ ] Test de connexion Google fonctionne

