# 🔌 Intégrations API & OAuth

## 🎯 Objectif

Ce document centralise les besoins d'intégration API et OAuth pour tous les widgets du dashboard personnel.

**Approche retenue :** OAuth direct (pas via n8n pour le moment)

---

## 📋 Widgets nécessitant des intégrations API

### 1. ✅ Calendar Widget

**Services à intégrer :**
- **Google Calendar** (OAuth 2.0)
- **Outlook Calendar / Microsoft Graph** (OAuth 2.0)
- **Notion Calendar** (API Key ou OAuth, optionnel)

**Status :** ⚠️ Architecture prête, OAuth à configurer

**Fichiers concernés :**
- `src/lib/sync/googleCalendarSync.ts`
- `src/lib/sync/outlookSync.ts`
- `src/lib/sync/calendarSyncManager.ts`

**À faire :**
1. Créer projets Google Cloud / Azure AD
2. Configurer OAuth 2.0 flows
3. Implémenter authentification (popup/redirect)
4. Stocker tokens de manière sécurisée (localStorage crypté ou backend)
5. Implémenter les appels API réels (GET/POST/PUT/DELETE)
6. Gérer refresh tokens et expiration

---

### 2. 📝 Notes Widget (à venir)

**Services potentiels :**
- **Notion API** (OAuth 2.0 ou API Key)
- **Google Keep** (API non officielle, optionnel)
- **Evernote** (API, optionnel)

**Status :** ⚠️ Widget non créé encore

**À prévoir :**
- Architecture similaire au Calendar avec providers
- Système de sync pour synchroniser les notes
- Support markdown et formatting

---

### 3. 💰 Finance Widget (à venir)

**Services potentiels :**
- **Google Sheets API** (OAuth 2.0) pour stockage
- **Banques** (APIs spécifiques selon la banque)
- **YNAB API** (OAuth 2.0, optionnel)
- **Mint API** (si disponible)

**Status :** ⚠️ Widget non créé encore

---

### 4. ✅ Todo Widget

**Services déjà intégrés (placeholders) :**
- **Notion API** (`src/lib/sync/notionSync.ts`)
- **Google Tasks** (`src/lib/sync/googleTasksSync.ts`)

**Status :** ⚠️ Architecture prête, OAuth à configurer

**Fichiers concernés :**
- `src/lib/sync/notionSync.ts`
- `src/lib/sync/googleTasksSync.ts`

---

### 5. 🌤️ Weather Widget

**Services intégrés :**
- ✅ **OpenWeatherMap API** (API Key) - **DÉJÀ FONCTIONNEL**
- ✅ **Geocoding API** (OpenWeatherMap) - **DÉJÀ FONCTIONNEL**

**Status :** ✅ Complet (pas besoin d'OAuth, utilise API Key)

---

## 🔐 Stratégie OAuth globale

### Architecture commune

Tous les widgets doivent suivre le même pattern :

```
src/lib/auth/
├── oauthManager.ts          # Gestionnaire OAuth centralisé
├── googleAuth.ts            # Provider Google (Calendar, Tasks, etc.)
├── microsoftAuth.ts         # Provider Microsoft (Outlook)
├── notionAuth.ts            # Provider Notion
└── tokenStorage.ts           # Stockage sécurisé des tokens
```

### Flow d'authentification

1. **User clique sur "Connecter"** → Ouvre popup OAuth
2. **Redirection vers provider** (Google/Microsoft/Notion)
3. **Callback avec code** → Échange contre access_token + refresh_token
4. **Stockage sécurisé** des tokens
5. **Refresh automatique** quand token expire

### Stockage des tokens

**Options :**
- `localStorage` (simple mais moins sécurisé)
- `localStorage` crypté (chiffrement côté client)
- **Backend API** (recommandé pour production) - tokens stockés côté serveur

**Pour MVP :** localStorage crypté
**Pour production :** Backend API avec chiffrement

---

## 📝 TODO Global

### Phase 1 : Architecture OAuth
- [ ] Créer `src/lib/auth/oauthManager.ts` (gestionnaire centralisé)
- [ ] Créer providers Google, Microsoft, Notion
- [ ] Implémenter tokenStorage sécurisé
- [ ] Créer composants UI pour connexion/déconnexion

### Phase 2 : Calendar Widget
- [ ] Configurer Google Cloud Console
- [ ] Configurer Azure AD (Microsoft)
- [ ] Implémenter OAuth flow Google Calendar
- [ ] Implémenter OAuth flow Outlook
- [ ] Remplacer placeholders dans `googleCalendarSync.ts`
- [ ] Remplacer placeholders dans `outlookSync.ts`
- [ ] Tester synchronisation bidirectionnelle

### Phase 3 : Todo Widget
- [ ] Configurer Notion API
- [ ] Implémenter OAuth flow Notion
- [ ] Implémenter OAuth flow Google Tasks
- [ ] Remplacer placeholders dans `notionSync.ts`
- [ ] Remplacer placeholders dans `googleTasksSync.ts`

### Phase 4 : Autres widgets
- [ ] Notes Widget → Intégration Notion si nécessaire
- [ ] Finance Widget → Intégrations selon besoins

---

## 🔧 Configuration requise

### Google Cloud Console
1. Créer projet
2. Activer Google Calendar API
3. Activer Google Tasks API
4. Créer OAuth 2.0 credentials
5. Configurer redirect URIs

### Azure AD (Microsoft)
1. Créer app registration
2. Configurer permissions (Calendars.ReadWrite)
3. Créer client ID / secret
4. Configurer redirect URIs

### Notion
1. Créer integration
2. Obtenir API key ou configurer OAuth
3. Partager bases avec l'intégration

---

## 📚 Ressources

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Graph OAuth](https://learn.microsoft.com/en-us/graph/auth/)
- [Notion API](https://developers.notion.com/)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Outlook Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)

---

## ⚠️ Notes importantes

1. **Sécurité** : Ne jamais commiter les credentials OAuth dans le repo
2. **Environment variables** : Utiliser `.env.local` pour les secrets
3. **Rate limiting** : Respecter les limites des APIs
4. **Error handling** : Gérer les erreurs d'authentification gracieusement
5. **User experience** : Fournir feedback clair (loading, success, errors)

---

## 🎯 Priorité d'implémentation

1. **Calendar Widget OAuth** (priorité haute)
2. **Todo Widget OAuth** (priorité moyenne)
3. **Architecture OAuth centralisée** (en parallèle)
4. **Autres widgets** (selon besoins)

