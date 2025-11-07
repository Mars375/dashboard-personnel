# 🔧 Correction de la configuration OAuth

## ❌ Problèmes identifiés

### 1. Variable Vercel incorrecte

**Actuellement sur Vercel :**
```
VITE_GOOGLE_REDIRECT_URIhttps://dashboard-oauth-proxy.onrender.com
```

**Problèmes :**
- ❌ Manque le `=` entre la clé et la valeur
- ❌ Mauvais nom de variable (doit être `VITE_OAUTH_PROXY_URL`)
- ❌ Mauvais URL (doit pointer vers le backend Render, pas le callback)

### 2. ALLOWED_ORIGINS avec slash final

**Actuellement sur Render :**
```
ALLOWED_ORIGINS=https://dashboard-personnel.vercel.app/
```

**Problème :**
- ❌ Le slash final (`/`) peut causer des problèmes CORS

### 3. Route `/` manquante sur Render

Le serveur retourne "Cannot GET /" car il n'y a pas de route pour la racine.

## ✅ Solutions

### 1. Corriger les variables Vercel

Dans **Vercel Dashboard → Settings → Environment Variables**, supprimez la variable incorrecte et ajoutez :

```env
VITE_OAUTH_PROXY_URL=https://dashboard-oauth-proxy.onrender.com
```

**⚠️ IMPORTANT :**
- Nom exact : `VITE_OAUTH_PROXY_URL` (pas `VITE_GOOGLE_REDIRECT_URI`)
- URL complète avec `https://`
- **PAS de slash final** (`/`)
- Doit pointer vers votre backend Render

**Optionnel (pour le dev local) :**
```env
VITE_GOOGLE_REDIRECT_URI=https://dashboard-personnel.vercel.app/oauth/google/callback
```

### 2. Corriger ALLOWED_ORIGINS sur Render

Dans **Render Dashboard → Environment**, modifiez :

**Avant :**
```
ALLOWED_ORIGINS=https://dashboard-personnel.vercel.app/
```

**Après :**
```
ALLOWED_ORIGINS=https://dashboard-personnel.vercel.app,http://localhost:5173
```

**⚠️ IMPORTANT :**
- **PAS de slash final** après `.app`
- Séparer plusieurs origines par des virgules (sans espaces)
- Inclure `http://localhost:5173` pour le développement local

### 3. Redéployer

1. **Vercel** : 
   - Modifiez les variables d'environnement
   - Redéployez manuellement ou attendez le redéploiement automatique

2. **Render** :
   - Modifiez `ALLOWED_ORIGINS`
   - Le service redéploiera automatiquement

### 4. Vérifier

1. **Backend Render** : Visitez `https://dashboard-oauth-proxy.onrender.com/`
   - Devrait afficher un JSON avec les endpoints disponibles

2. **Health check** : Visitez `https://dashboard-oauth-proxy.onrender.com/health`
   - Devrait afficher : `{"status":"ok","timestamp":"..."}`

3. **Frontend Vercel** : Essayez de vous connecter à Google
   - Devrait fonctionner maintenant

## 📋 Checklist finale

- [ ] `VITE_OAUTH_PROXY_URL` configurée dans Vercel avec l'URL Render (sans slash final)
- [ ] `ALLOWED_ORIGINS` sur Render sans slash final : `https://dashboard-personnel.vercel.app,http://localhost:5173`
- [ ] Backend Render redéployé
- [ ] Frontend Vercel redéployé
- [ ] Test de `/` sur Render fonctionne
- [ ] Test de `/health` sur Render fonctionne
- [ ] Connexion Google fonctionne sur Vercel

## 🐛 Note sur l'erreur CSP

L'erreur dans la console :
```
Refused to load the font 'https://r2cdn.perplexity.ai/fonts/FKGroteskNeue.woff2'
```

C'est lié à Perplexity (un service externe) et **n'affecte pas** le fonctionnement OAuth. Vous pouvez l'ignorer pour l'instant.

