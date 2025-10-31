# 🔌 API et Intégrations

## OpenWeatherMap API

### Configuration

Le Weather Widget utilise l'API OpenWeatherMap pour récupérer les données météo.

**Plan gratuit** :

- 60 appels/min
- 1 million d'appels/mois

### Endpoints utilisés

1. **Geocoding API** : Recherche de villes

   ```
   GET https://api.openweathermap.org/geo/1.0/direct?q={city}&limit=5&appid={API_KEY}
   ```

2. **Current Weather API** : Météo actuelle

   ```
   GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&lang=fr&appid={API_KEY}
   ```

3. **5 Day Forecast API** : Prévisions
   ```
   GET https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&lang=fr&appid={API_KEY}
   ```

### Gestion des erreurs

- **401** : Clé API invalide
- **404** : Ville non trouvée
- **429** : Limite de taux dépassée
- **Network errors** : Connexion échouée

Toutes les erreurs sont gérées gracieusement avec des messages utilisateur clairs.

## Notion API (Synchronisation)

### Configuration

Pour synchroniser les todos avec Notion :

1. Créer une intégration Notion
2. Obtenir l'API Key
3. Créer ou sélectionner une base de données
4. Configurer dans l'application

### Structure attendue

La base de données Notion doit avoir ces propriétés :

- `Title` (texte) : Titre de la tâche
- `Done` (checkbox) : État de complétion
- `Priority` (select) : Priorité
- `Deadline` (date) : Date limite

**Note** : Actuellement en placeholder, à implémenter selon vos besoins.

## Google Tasks API (Synchronisation)

### Configuration

Pour synchroniser avec Google Tasks :

1. Créer un projet Google Cloud
2. Activer l'API Google Tasks
3. Créer des credentials OAuth 2.0
4. Configurer dans l'application

**Note** : Actuellement en placeholder, à implémenter selon vos besoins.

## Web Notifications API

### Permissions

Le Todo Widget demande la permission de notifications pour :

- Rappels de deadlines
- Notifications personnalisables

### Fonctionnalités

- Notification au moment de la deadline
- Notifications X jours avant (configurable)
- Notification si la deadline est dépassée

## localStorage API

### Clés utilisées

```
weather:lastCity              # Dernière ville recherchée
todos:list-{listId}           # Todos d'une liste spécifique
todos:lists                   # Métadonnées des listes
todos:current-list            # Liste courante
todos:sync-config             # Configuration de synchronisation
todos:notification-settings   # Paramètres de notifications
```

### Gestion des erreurs

Toutes les opérations localStorage sont wrappées dans des try/catch pour gérer :

- QuotaExceededError
- SecurityError (mode privé)
- Absence de localStorage (SSR)

## Architecture des synchronisations

### Pattern Provider

```typescript
interface SyncProvider {
	name: string;
	enabled: boolean;
	sync(): Promise<SyncResult>;
	pushTodos(todos: Todo[], listId: string): Promise<void>;
	pullTodos(listId: string): Promise<Todo[]>;
}
```

### SyncManager

Le `SyncManager` orchestre plusieurs providers :

- Détection automatique des providers activés
- Synchronisation parallèle
- Gestion d'erreurs par provider
- Logs des résultats

### Workflow de sync

1. **Push** : Envoyer les todos locaux vers l'API
2. **Pull** : Récupérer les todos depuis l'API
3. **Merge** : Fusionner intelligemment les données
4. **Persist** : Sauvegarder dans localStorage

## Sécurité

### Clés API

- ⚠️ **Jamais commitées** dans le repository
- Stockées dans `.env.local` (gitignored)
- Utilisées uniquement côté client (exposées au navigateur)

### Données utilisateur

- Toutes les données sont stockées localement
- Aucune donnée sensible n'est envoyée sans consentement
- Les synchronisations sont optionnelles

### CORS

Les APIs externes doivent supporter CORS pour fonctionner depuis le navigateur.

## Limitations

### OpenWeatherMap Free Plan

- 60 appels/min maximum
- 1 million appels/mois
- Pas d'historique météo
- Pas de prévisions 16 jours

### localStorage

- ~5-10 MB de stockage selon le navigateur
- Pas de synchronisation multi-device native
- Données perdues si cache nettoyé

## Améliorations futures

- [ ] Cache des requêtes API
- [ ] IndexedDB pour plus de stockage
- [ ] Service Worker pour offline
- [ ] Synchronisation cloud (Firebase, Supabase)
- [ ] Rate limiting intelligent
