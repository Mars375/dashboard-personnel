# 🚀 Guide de démarrage rapide pour tester OAuth

## 📋 Étapes rapides

### 1. Configuration Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez un projet existant
3. Activez **Google Calendar API**
4. Allez dans **APIs & Services** > **Credentials**
5. Cliquez sur **Create Credentials** > **OAuth client ID**
6. Configurez :
   - **Application type** : Web application
   - **Name** : Dashboard Personnel
   - **Authorized redirect URIs** : 
     - `http://localhost:5173/oauth/google/callback`
7. Copiez le **Client ID**

### 2. Configuration locale

Créez un fichier `.env.local` à la racine du projet :

```env
# Client ID (peut être exposé)
VITE_GOOGLE_CLIENT_ID=votre_google_client_id_ici
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback

# Client Secret (DOIT rester secret - pas de préfixe VITE_)
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
```

**Important** : Pour obtenir le Client Secret :
1. Google Cloud Console > APIs & Services > Credentials
2. Cliquez sur votre OAuth 2.0 Client ID
3. Copiez le **Client Secret** (pas juste le Client ID)

### 3. Lancer l'application

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

### 4. Tester dans le Calendar Widget

1. **Redimensionnez le Calendar Widget en mode Full** (grande taille) pour voir tous les boutons
2. **Cliquez sur "Se connecter à Google Calendar"** 
   - Une popup OAuth devrait s'ouvrir
   - Connectez-vous avec votre compte Google
   - Autorisez l'accès au calendrier
   - La popup devrait se fermer automatiquement
3. **Vérifiez la connexion** :
   - Le bouton devrait changer pour "Déconnecter Google"
   - Vérifiez dans DevTools > Application > Local Storage > `oauth:connections`
4. **Testez la synchronisation** :
   - Cliquez sur le bouton **Synchroniser** (icône RefreshCw)
   - Les événements de votre Google Calendar devraient apparaître dans le widget

## ✅ Checklist de test rapide

- [ ] Configuration Google OAuth terminée
- [ ] Fichier `.env.local` créé avec le Client ID
- [ ] Application lancée (`pnpm dev`)
- [ ] Calendar Widget en mode Full
- [ ] Connexion OAuth fonctionne (popup s'ouvre)
- [ ] Tokens sauvegardés dans localStorage
- [ ] Bouton change pour "Déconnecter Google"
- [ ] Synchronisation fonctionne (bouton RefreshCw)
- [ ] Événements Google Calendar apparaissent dans le widget
- [ ] Déconnexion fonctionne

## 🐛 Problèmes courants

### La popup est bloquée
- Autorisez les popups pour `localhost:5173` dans les paramètres du navigateur

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URI dans `.env.local` correspond **exactement** à celle dans Google Cloud Console
- L'URI doit être : `http://localhost:5173/oauth/google/callback`

### Erreur "Invalid client_id"
- Vérifiez que `VITE_GOOGLE_CLIENT_ID` dans `.env.local` correspond au Client ID de Google Cloud Console
- **Redémarrez les serveurs** après modification de `.env.local`

### Erreur "Le backend proxy OAuth n'est pas démarré"
- Assurez-vous que le backend proxy est lancé : `pnpm dev:server`
- Vérifiez que le port 3001 n'est pas déjà utilisé
- Vérifiez les logs du backend pour les erreurs

### Erreur "GOOGLE_CLIENT_SECRET manquant"
- Vérifiez que `GOOGLE_CLIENT_SECRET` est dans `.env.local` (sans préfixe `VITE_`)
- Redémarrez le serveur backend après ajout

### Aucun événement ne s'affiche
- Vérifiez que vous avez des événements dans votre Google Calendar
- Vérifiez que les événements sont dans la plage de dates (3 mois avant/après)
- Ouvrez la console du navigateur pour voir les erreurs

## 📚 Documentation complète

Voir [docs/TESTING_OAUTH.md](./TESTING_OAUTH.md) pour la documentation complète de test.

