# ⚠️ Backend requis pour OAuth complet

## Problème actuel

Le flow OAuth Google fonctionne partiellement :
- ✅ La popup s'ouvre
- ✅ L'utilisateur peut s'authentifier
- ✅ Le callback reçoit le code
- ❌ **L'échange du code contre des tokens nécessite un backend**

## Pourquoi un backend est nécessaire

L'échange du `code` d'autorisation contre des `tokens` nécessite :
- Le `client_secret` (ne doit **jamais** être exposé côté client)
- Une requête sécurisée à l'endpoint Google OAuth

```typescript
POST https://oauth2.googleapis.com/token
{
  code: "...",
  client_id: "...",
  client_secret: "...", // ⚠️ Secret - ne jamais exposer côté client
  redirect_uri: "...",
  grant_type: "authorization_code"
}
```

## Solutions

### Option 1 : Backend proxy simple (Recommandé pour MVP)

Créer un petit backend Express/Node.js qui :
- Reçoit le code depuis le frontend
- Échange le code contre les tokens avec le client_secret
- Retourne les tokens au frontend

**Exemple backend Express minimal :**

```typescript
// server/oauth-proxy.ts
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/oauth/exchange', async (req, res) => {
  const { code, provider } = req.body;
  
  if (provider === 'google') {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET, // ✅ Secret côté serveur
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await response.json();
    res.json(tokens);
  }
});
```

### Option 2 : Google Identity Services (Nouvelle API)

Utiliser la nouvelle API Google Identity Services qui fonctionne différemment et peut être utilisée côté client.

### Option 3 : Service proxy externe

Utiliser un service comme Firebase Functions, Vercel Functions, ou Netlify Functions pour créer le proxy.

## Pour tester maintenant (sans backend)

Pour tester le reste du flow OAuth (popup, callback, etc.) sans backend :
1. La popup devrait maintenant se fermer automatiquement après le callback
2. Vous verrez une erreur concernant l'échange du code (normal sans backend)
3. Le reste du flow (connexion UI, etc.) peut être testé

## Prochaines étapes

Pour rendre OAuth complètement fonctionnel :
1. Créer un backend proxy simple (voir Option 1)
2. Modifier `exchangeCodeForTokensWithProxy` dans `googleAuth.ts` pour appeler ce backend
3. Déployer le backend avec les variables d'environnement sécurisées

