# 🔧 Dépannage OAuth - Erreurs courantes

## ❌ Problème 1 : ERR_CONNECTION_REFUSED sur Vercel

Si vous obtenez une erreur `ERR_CONNECTION_REFUSED` ou `Ce site est inaccessible` lors de la connexion Google sur votre application déployée sur Vercel, c'est que le **backend OAuth proxy n'est pas configuré ou accessible**.

## ❌ Problème 2 : "localhost n'autorise pas la connexion"

Si après avoir choisi un compte Google, vous obtenez l'erreur `localhost n'autorise pas la connexion`, c'est que le `redirect_uri` pointe vers `localhost` au lieu de l'URL Vercel.

**Solution :**
1. Dans **Vercel Dashboard → Settings → Environment Variables**, supprimez `VITE_GOOGLE_REDIRECT_URI` si elle pointe vers localhost
2. Le code utilisera automatiquement l'URL Vercel (`window.location.origin`)
3. Vérifiez que l'URL dans Google Console correspond exactement : `https://votre-app.vercel.app/oauth/google/callback`
4. Redéployez Vercel

## ✅ Solution : Vérifier la configuration

### 1. Vérifier que le backend est déployé

Le backend OAuth proxy **doit être déployé séparément** sur Railway ou Render. Vercel ne peut pas exécuter le serveur Express.

**Vérifiez :**
- ✅ Le backend est déployé sur Railway ou Render
- ✅ Le backend est accessible (testez l'URL dans votre navigateur)
- ✅ Le backend répond sur `/health` ou `/api/oauth/exchange`

### 2. Vérifier la variable d'environnement Vercel

Dans le dashboard Vercel, allez dans **Settings → Environment Variables** et vérifiez :

```env
VITE_OAUTH_PROXY_URL=https://votre-backend.railway.app
```

**⚠️ IMPORTANT :**
- L'URL doit être **complète** avec `https://`
- Pas de slash final (`/`)
- L'URL doit pointer vers votre backend Railway/Render, **PAS** vers Vercel

### 3. Vérifier les variables d'environnement du backend

Dans Railway ou Render, vérifiez que ces variables sont configurées :

```env
VITE_GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
ALLOWED_ORIGINS=https://votre-app.vercel.app,http://localhost:5173
```

### 4. Vérifier les URLs de redirection Google

Dans [Google Cloud Console](https://console.cloud.google.com) :

1. Allez dans **APIs & Services** → **Credentials**
2. Cliquez sur votre OAuth 2.0 Client ID
3. Vérifiez que **Authorized redirect URIs** contient :
   - `https://votre-app.vercel.app/oauth/google/callback`
   - `http://localhost:5173/oauth/google/callback` (pour le dev local)

**⚠️ L'URL doit correspondre EXACTEMENT**, y compris :
- Le protocole (`https://`)
- Le domaine complet
- Le chemin (`/oauth/google/callback`)
- **PAS de slash final**

### 5. Redéployer après modification

Après avoir modifié les variables d'environnement :

1. **Vercel** : Redéployez l'application (ou attendez le redéploiement automatique)
2. **Railway/Render** : Redéployez le backend si nécessaire

## 🔍 Diagnostic

### Tester le backend

Ouvrez dans votre navigateur :
```
https://votre-backend.railway.app/health
```

Vous devriez voir :
```json
{"status":"ok","timestamp":"..."}
```

### Tester l'endpoint OAuth

Essayez de faire une requête POST (avec un outil comme Postman ou curl) :
```bash
curl -X POST https://votre-backend.railway.app/api/oauth/exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"test","provider":"google"}'
```

Vous devriez obtenir une erreur 400 (normal, car le code est invalide), mais **PAS** une erreur de connexion.

### Vérifier les logs

- **Vercel** : Allez dans **Deployments** → Cliquez sur le dernier déploiement → **View Function Logs**
- **Railway/Render** : Consultez les logs du service backend

## 🐛 Erreurs courantes

### "ERR_CONNECTION_REFUSED"

**Cause** : Le backend n'est pas accessible ou l'URL est incorrecte.

**Solution** :
1. Vérifiez que le backend est déployé et accessible
2. Vérifiez que `VITE_OAUTH_PROXY_URL` est correctement configurée dans Vercel
3. Vérifiez que l'URL n'a pas de slash final

### "redirect_uri_mismatch"

**Cause** : L'URL de redirection dans Google Console ne correspond pas à celle utilisée.

**Solution** :
1. Vérifiez que l'URL dans Google Console est exactement : `https://votre-app.vercel.app/oauth/google/callback`
2. Vérifiez qu'il n'y a pas de slash final
3. Redéployez l'application Vercel après modification

### "CORS error"

**Cause** : Le backend n'autorise pas les requêtes depuis le frontend Vercel.

**Solution** :
1. Vérifiez que `ALLOWED_ORIGINS` dans le backend contient : `https://votre-app.vercel.app`
2. Redéployez le backend après modification

### "GOOGLE_CLIENT_SECRET manquant"

**Cause** : Le secret n'est pas configuré dans le backend.

**Solution** :
1. Vérifiez que `GOOGLE_CLIENT_SECRET` est dans les variables d'environnement du backend (Railway/Render)
2. **PAS** dans Vercel (c'est normal, il doit rester dans le backend uniquement)

## 📝 Checklist complète

Avant de tester la connexion OAuth en production :

- [ ] Backend déployé sur Railway ou Render
- [ ] Backend accessible (test `/health`)
- [ ] `VITE_OAUTH_PROXY_URL` configurée dans Vercel avec l'URL du backend
- [ ] `VITE_GOOGLE_CLIENT_ID` configurée dans Vercel
- [ ] `GOOGLE_CLIENT_SECRET` configurée dans le backend (Railway/Render)
- [ ] `ALLOWED_ORIGINS` configurée dans le backend avec l'URL Vercel
- [ ] URL de redirection ajoutée dans Google Console : `https://votre-app.vercel.app/oauth/google/callback`
- [ ] Application redéployée sur Vercel après modification des variables
- [ ] Backend redéployé si nécessaire

## 🆘 Besoin d'aide ?

Si le problème persiste :

1. Vérifiez les logs Vercel et Railway/Render
2. Testez le backend directement avec curl/Postman
3. Vérifiez la console du navigateur (F12) pour les erreurs JavaScript
4. Consultez [DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md) pour le guide complet de déploiement

