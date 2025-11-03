# Dépannage : Erreur `invalid_grant`

## Problème

Vous recevez l'erreur `invalid_grant` avec "Bad Request" lors de l'échange du code OAuth.

## Causes possibles

1. **Le `redirect_uri` ne correspond pas exactement**
   - Le `redirect_uri` utilisé dans l'URL OAuth doit être **identique** à celui utilisé lors de l'échange
   - Il doit aussi correspondre **exactement** à celui configuré dans Google Cloud Console

2. **Le code a déjà été utilisé**
   - Les codes OAuth ne peuvent être utilisés qu'une seule fois
   - Solution : Relancez la connexion pour obtenir un nouveau code

3. **Le code a expiré**
   - Les codes OAuth expirent rapidement (quelques minutes)
   - Solution : Relancez la connexion

## Vérifications dans Google Cloud Console

### 1. Vérifier les Redirect URIs autorisés

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. **APIs & Services** > **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID**
5. Dans la section **Authorized redirect URIs**, vérifiez que vous avez exactement :
   ```
   http://localhost:5173/oauth/google/callback
   ```

⚠️ **IMPORTANT** :
- Pas de slash final : `http://localhost:5173/oauth/google/callback` ✅ (pas `/callback/` ❌)
- Pas de `www` : `http://localhost:5173` ✅ (pas `http://www.localhost:5173` ❌)
- Correspondance exacte : doit être **identique** caractère par caractère

### 2. Vérifier votre fichier `.env.local`

Votre fichier `.env.local` doit contenir :

```env
VITE_GOOGLE_CLIENT_ID=828225926659-2o4lepmrhu82o37bm757h6faj9hbucin.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
GOOGLE_CLIENT_SECRET=votre_secret_ici
```

⚠️ **Points importants** :
- `VITE_GOOGLE_REDIRECT_URI` doit correspondre **exactement** à celui dans Google Cloud Console
- Pas de slash final
- Pas d'espaces autour du `=`

## Étapes de dépannage

### Étape 1 : Vérifier les logs du backend

Quand vous lancez `pnpm dev:server`, vous devriez voir :

```
🔄 Échange du code OAuth...
   Client ID: 828225926659-...
   Redirect URI (normalisé): http://localhost:5173/oauth/google/callback
```

Si le `Redirect URI` est différent, c'est le problème.

### Étape 2 : Vérifier dans Google Cloud Console

Assurez-vous que le redirect URI dans Google Cloud Console correspond **exactement** à celui dans les logs.

### Étape 3 : Relancer la connexion

1. Fermez la popup OAuth si elle est ouverte
2. Cliquez à nouveau sur le bouton "Se connecter à Google Calendar"
3. Autorisez l'application
4. La connexion devrait fonctionner

### Étape 4 : Si ça ne fonctionne toujours pas

1. Vérifiez que le backend proxy est bien démarré : `pnpm dev:server`
2. Vérifiez les logs du backend pour voir l'erreur exacte
3. Vérifiez que `GOOGLE_CLIENT_SECRET` est bien dans `.env.local` (sans préfixe `VITE_`)
4. Redémarrez le backend après avoir modifié `.env.local`

## Solutions courantes

### Erreur : "redirect_uri_mismatch"

**Cause** : Le `redirect_uri` ne correspond pas à celui dans Google Cloud Console.

**Solution** :
1. Copiez le `redirect_uri` depuis les logs du backend
2. Allez dans Google Cloud Console > Credentials > Votre OAuth Client ID
3. Ajoutez ce `redirect_uri` exact dans **Authorized redirect URIs**
4. Sauvegardez
5. Attendez quelques secondes pour que les changements se propagent
6. Relancez la connexion

### Erreur : "invalid_grant" sans détails

**Cause** : Code expiré ou déjà utilisé.

**Solution** :
1. Fermez la popup OAuth
2. Relancez la connexion (cela générera un nouveau code)
3. Si ça ne fonctionne toujours pas, attendez 1-2 minutes avant de réessayer

## Test rapide

Pour vérifier que tout est correct :

```bash
# 1. Vérifiez que le backend démarre sans erreur
pnpm dev:server

# Vous devriez voir :
# ✅ VITE_GOOGLE_CLIENT_ID: ✅ Présent
# ✅ GOOGLE_CLIENT_SECRET: ✅ Présent

# 2. Dans un autre terminal, démarrez le frontend
pnpm dev

# 3. Essayez de vous connecter
# 4. Regardez les logs du backend pour voir l'erreur exacte
```

