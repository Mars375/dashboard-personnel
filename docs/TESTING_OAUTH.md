# 🧪 Guide de test OAuth et Google Calendar API

Ce guide explique comment tester l'implémentation OAuth et Google Calendar API.

## 📋 Prérequis

### 1. Configuration OAuth

Créez un fichier `.env.local` à la racine du projet avec :

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=votre_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
```

**Important** : Vous devez avoir configuré OAuth dans Google Cloud Console avec l'URI de redirection exacte.

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Lancer le serveur de développement

```bash
pnpm dev
```

L'application sera accessible sur `http://localhost:5173`

## 🧪 Tests à effectuer

### Test 1 : Connexion OAuth Google

1. Ouvrez le Calendar Widget en mode **Full** (grande taille)
2. Cliquez sur le bouton **"Connecter à Google Calendar"** (à implémenter)
3. Une popup OAuth Google devrait s'ouvrir
4. Connectez-vous avec votre compte Google
5. Autorisez l'accès au calendrier
6. La popup devrait se fermer automatiquement
7. Un toast de succès devrait apparaître : "Connexion à google réussie"

**Vérifications** :
- ✅ La popup OAuth s'ouvre correctement
- ✅ La connexion fonctionne sans erreur
- ✅ Le toast de succès apparaît
- ✅ Les tokens sont sauvegardés dans `localStorage` (vérifier avec DevTools)

### Test 2 : Vérification de la connexion

1. Vérifiez que le bouton change pour **"Déconnecter Google"**
2. Vérifiez dans les DevTools (`Application` > `Local Storage`) :
   - Clé : `oauth:connections`
   - Doit contenir un objet avec `provider: "google"` et `tokens`

### Test 3 : Pull des événements depuis Google Calendar

1. Cliquez sur le bouton **"Synchroniser"** (RefreshCw) dans le Calendar Widget
2. Le bouton devrait afficher un spinner pendant la synchronisation
3. Un toast devrait apparaître : "Synchronisation réussie: X événement(s) synchronisé(s)"
4. Les événements de votre Google Calendar devraient apparaître dans le widget

**Vérifications** :
- ✅ La synchronisation fonctionne sans erreur
- ✅ Les événements Google Calendar apparaissent dans le widget
- ✅ Les dates, heures, descriptions sont correctement affichées
- ✅ Les événements récurrents sont gérés

### Test 4 : Push des événements vers Google Calendar

1. Créez un nouvel événement dans le Calendar Widget
2. Cliquez sur **"Synchroniser"**
3. Vérifiez dans Google Calendar que l'événement apparaît

**Vérifications** :
- ✅ L'événement est créé dans Google Calendar
- ✅ Les détails (titre, date, heure, description) sont corrects
- ✅ Les événements avec répétition fonctionnent

### Test 5 : Mise à jour d'événements

1. Modifiez un événement qui vient de Google Calendar
2. Cliquez sur **"Synchroniser"**
3. Vérifiez que les modifications apparaissent dans Google Calendar

**Vérifications** :
- ✅ Les modifications sont synchronisées avec Google Calendar
- ✅ Les événements avec ID `google-*` sont correctement mis à jour

### Test 6 : Déconnexion

1. Cliquez sur **"Déconnecter Google"**
2. Un toast de succès devrait apparaître
3. Les tokens devraient être supprimés de `localStorage`
4. La synchronisation ne devrait plus fonctionner

**Vérifications** :
- ✅ La déconnexion fonctionne
- ✅ Les tokens sont supprimés
- ✅ Une erreur apparaît si on tente de synchroniser sans connexion

### Test 7 : Refresh automatique des tokens

1. Attendez que le token expire (ou modifiez manuellement `expiresAt` dans `localStorage`)
2. Tentez de synchroniser
3. Le token devrait être automatiquement rafraîchi

**Vérifications** :
- ✅ Le token est rafraîchi automatiquement
- ✅ La synchronisation fonctionne avec le nouveau token

## 🐛 Dépannage

### Erreur "Popup bloquée"

**Problème** : La popup OAuth est bloquée par le navigateur.

**Solution** :
- Autorisez les popups pour `localhost:5173`
- Vérifiez les paramètres du navigateur
- Désactivez temporairement les bloqueurs de publicité

### Erreur "redirect_uri_mismatch"

**Problème** : L'URI de redirection ne correspond pas à celle configurée dans Google Cloud Console.

**Solution** :
- Vérifiez que `VITE_GOOGLE_REDIRECT_URI` correspond exactement à celle dans Google Cloud Console
- L'URI doit être `http://localhost:5173/oauth/google/callback` pour le dev

### Erreur "Invalid client_id"

**Problème** : Le Client ID n'est pas correct.

**Solution** :
- Vérifiez que `VITE_GOOGLE_CLIENT_ID` dans `.env.local` correspond au Client ID de Google Cloud Console
- Redémarrez le serveur de développement après modification de `.env.local`

### Erreur "Non connecté à Google"

**Problème** : Tentative de synchronisation sans être connecté.

**Solution** :
- Connectez-vous d'abord avec le bouton OAuth
- Vérifiez que les tokens sont présents dans `localStorage`

### Erreur "Token expiré"

**Problème** : Le token d'accès a expiré.

**Solution** :
- Le token devrait être rafraîchi automatiquement
- Si ce n'est pas le cas, reconnectez-vous manuellement

### Les événements ne s'affichent pas

**Problème** : La synchronisation fonctionne mais les événements ne s'affichent pas.

**Solution** :
- Vérifiez que les événements sont dans la plage de dates (3 mois avant/après)
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que le calendrier sélectionné est correct

## 📊 Vérification dans les DevTools

### Console Network

Ouvrez l'onglet **Network** dans les DevTools et vérifiez :

1. **Requête OAuth** :
   - URL : `https://accounts.google.com/o/oauth2/v2/auth?...`
   - Status : 200 (redirection)

2. **Requête Callback** :
   - URL : `http://localhost:5173/oauth/google/callback?...`
   - Status : 200

3. **Requête API Google Calendar** :
   - URL : `https://www.googleapis.com/calendar/v3/calendars/primary/events?...`
   - Headers : `Authorization: Bearer <token>`
   - Status : 200

### Local Storage

Vérifiez la clé `oauth:connections` :

```json
[
  {
    "provider": "google",
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresAt": 1234567890,
      "tokenType": "Bearer"
    },
    "user": {
      "id": "...",
      "email": "...",
      "name": "..."
    },
    "connectedAt": 1234567890
  }
]
```

## ✅ Checklist de test

- [ ] Connexion OAuth fonctionne
- [ ] Déconnexion fonctionne
- [ ] Pull des événements fonctionne
- [ ] Push des événements fonctionne
- [ ] Mise à jour des événements fonctionne
- [ ] Refresh automatique des tokens fonctionne
- [ ] Gestion des erreurs fonctionne
- [ ] Les événements s'affichent correctement dans le widget
- [ ] Les événements récurrents sont gérés
- [ ] Les événements avec/sans heure fonctionnent

## 🎯 Prochaines étapes après les tests

Une fois les tests réussis :
1. Implémenter Outlook Calendar API (similaire à Google)
2. Implémenter Google Tasks API
3. Créer le widget Notes
4. Créer le widget Finance
5. Implémenter la communication inter-widgets

