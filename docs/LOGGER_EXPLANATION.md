# 📝 À quoi sert le Logger ?

## 🎯 Objectif Principal

Le logger remplace les `console.log/warn/error` directs par un système avec **niveaux de log** qui permet de :

1. **Désactiver les logs de debug en production** (console plus propre)
2. **Catégoriser les logs** par importance (debug, info, warn, error)
3. **Faciliter le debug** en développement avec des logs détaillés

---

## 🔍 Différence avec `console.log` direct

### ❌ Avant (avec `console.log` direct)

```typescript
// Dans googleTasksSync.ts
console.log(`📦 taskListId chargé depuis localStorage: ${this.taskListId}`);
console.log(`✅ Liste "${defaultList.title}" trouvée`);
console.log(`🔄 Tentative de retry...`);
console.warn(`⚠️ Liste non trouvée`);
console.error("Erreur lors de la récupération");

// Problème : TOUS ces logs s'affichent en production ! 😱
// La console est polluée avec des informations de debug
```

### ✅ Après (avec `logger`)

```typescript
// Dans googleTasksSync.ts
logger.debug(`📦 taskListId chargé depuis localStorage: ${this.taskListId}`);
logger.debug(`✅ Liste "${defaultList.title}" trouvée`);
logger.debug(`🔄 Tentative de retry...`);
logger.warn(`⚠️ Liste non trouvée`);
logger.error("Erreur lors de la récupération");

// Avantage : Les logs de debug sont automatiquement désactivés en production ! ✅
// Seuls les warnings et erreurs s'affichent
```

---

## 📊 Les 4 Niveaux de Log

### 1. `logger.debug()` - Logs de Debug

**Quand l'utiliser** : Informations détaillées pour le développement

```typescript
logger.debug(`📦 taskListId chargé depuis localStorage: ${taskListId}`);
logger.debug(`🚀 Synchronisation immédiate dans Google Tasks: "${todo.title}"`);
logger.debug(`✅ ${todos.length} tâche(s) récupérée(s) depuis Google Tasks`);
```

**Comportement** :

- ✅ **En développement** (`npm run dev`) : S'affiche dans la console
- ❌ **En production** (`npm run build`) : **AUTOMATIQUEMENT DÉSACTIVÉ**

**Exemple dans la console (dev)** :

```
[DEBUG] 📦 taskListId chargé depuis localStorage: @default
[DEBUG] 🚀 Synchronisation immédiate dans Google Tasks: "Acheter du pain"
[DEBUG] ✅ 5 tâche(s) récupérée(s) depuis Google Tasks
```

**Exemple dans la console (production)** :

```
(rien, ces logs ne s'affichent pas)
```

---

### 2. `logger.info()` - Informations Importantes

**Quand l'utiliser** : Informations utiles même en production

```typescript
logger.info("Synchronisation démarrée");
logger.info(`Utilisateur connecté: ${userId}`);
```

**Comportement** :

- ✅ **Toujours affiché** (dev et production)

**Exemple dans la console** :

```
[INFO] Synchronisation démarrée
[INFO] Utilisateur connecté: user123
```

---

### 3. `logger.warn()` - Avertissements

**Quand l'utiliser** : Situations suspectes mais non bloquantes

```typescript
logger.warn(`⚠️ Liste "${listName}" non trouvée après création`);
logger.warn(`⚠️ Aucun ID Google retourné pour la tâche "${todo.title}"`);
logger.warn("Impossible de charger taskListId depuis localStorage");
```

**Comportement** :

- ✅ **Toujours affiché** (dev et production)
- Utilise `console.warn` (affiche en jaune dans la console)

**Exemple dans la console** :

```
[WARN] ⚠️ Liste "Mes Tâches" non trouvée après création
[WARN] ⚠️ Aucun ID Google retourné pour la tâche "Acheter du pain"
```

---

### 4. `logger.error()` - Erreurs

**Quand l'utiliser** : Erreurs à investiguer

```typescript
logger.error("Erreur lors de la récupération des listes manquantes:", error);
logger.error(
	`Erreur lors de la récupération/création de la liste "${listName}":`,
	error
);
logger.error("Erreur lors de la synchronisation avec Google Tasks:", error);
```

**Comportement** :

- ✅ **Toujours affiché** (dev et production)
- Utilise `console.error` (affiche en rouge dans la console)

**Exemple dans la console** :

```
[ERROR] Erreur lors de la récupération des listes manquantes: TypeError: ...
[ERROR] Erreur lors de la synchronisation avec Google Tasks: NetworkError: ...
```

---

## 🎨 Avantages Concrets

### 1. **Console Propre en Production**

**Avant** :

```
📦 taskListId chargé depuis localStorage: @default
✅ Liste "Mes Tâches" trouvée
🔄 Tentative de retry...
✅ 5 tâche(s) récupérée(s)
🚀 Synchronisation immédiate...
... (des dizaines de logs)
```

**Après** :

```
(rien, sauf warnings et erreurs si nécessaire)
```

---

### 2. **Meilleure Organisation**

Tous les logs sont préfixés avec leur niveau :

- `[DEBUG]` : Informations de debug
- `[INFO]` : Informations importantes
- `[WARN]` : Avertissements
- `[ERROR]` : Erreurs

Facilite la recherche dans la console avec `Ctrl+F` : chercher `[ERROR]` pour trouver toutes les erreurs.

---

### 3. **Performance**

En production, les logs de debug ne sont **pas exécutés** (grâce à `if (isDev)`), ce qui :

- Réduit les appels à `console.log`
- Améliore légèrement les performances
- Réduit la taille du bundle (si le code est tree-shaken)

---

## 📝 Exemples d'Utilisation dans le Code

### Exemple 1 : Synchronisation Google Tasks

```typescript
// ✅ Bon usage
logger.debug(`🚀 Synchronisation immédiate dans Google Tasks: "${todo.title}"`);
logger.debug(`🔄 ID de tâche mis à jour: ${localId} → ${googleId}`);
logger.warn(`⚠️ Aucun ID Google retourné pour la tâche "${todo.title}"`);
logger.error("Erreur lors de la synchronisation avec Google Tasks:", error);
```

---

### Exemple 2 : Gestion des Listes

```typescript
// ✅ Bon usage
logger.debug(
	`📋 ${missingGoogleLists.length} liste(s) Google Tasks trouvée(s)`
);
logger.debug(`➕ Création de la liste locale: "${listName}"`);
logger.warn(`⚠️ Liste "${listName}" non trouvée après création`);
logger.error("Erreur lors de la récupération des listes manquantes:", error);
```

---

## 🔧 Utilisation dans le Code

### Import

```typescript
import { logger } from "@/lib/logger";
```

### Utilisation

```typescript
// Debug (seulement en dev)
logger.debug("Message de debug");

// Info (toujours affiché)
logger.info("Message d'information");

// Warning (toujours affiché)
logger.warn("Message d'avertissement");

// Error (toujours affiché)
logger.error("Message d'erreur", error);
```

---

## 🚀 Améliorations Futures Possibles

Le logger peut être étendu pour :

1. **Enregistrer dans un fichier** (pour les erreurs en production)
2. **Envoyer à un service externe** (Sentry, LogRocket, etc.)
3. **Filtrer par contexte** (ex: logger uniquement pour Google Tasks)
4. **Niveaux configurables** (ex: afficher debug en production si nécessaire)

---

## 📊 Résumé

| Niveau  | Quand l'utiliser                              | En Dev | En Prod |
| ------- | --------------------------------------------- | ------ | ------- |
| `debug` | Informations détaillées pour le développement | ✅ Oui | ❌ Non  |
| `info`  | Informations importantes                      | ✅ Oui | ✅ Oui  |
| `warn`  | Avertissements, situations suspectes          | ✅ Oui | ✅ Oui  |
| `error` | Erreurs à investiguer                         | ✅ Oui | ✅ Oui  |

---

**En résumé** : Le logger permet de garder la console propre en production tout en gardant des logs détaillés en développement ! 🎯
