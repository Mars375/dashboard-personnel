# 🧪 Guide de Test - Synchronisation Google Tasks

## ✅ Checklist de Test

### 1. Connexion Google OAuth

- [ ] Cliquer sur le bouton Google OAuth dans le header du dashboard
- [ ] Vérifier que la connexion fonctionne (toast de succès)
- [ ] Vérifier que le bouton indique "Connecté"

### 2. Synchronisation Initiale

- [ ] Vérifier que les tâches Google Tasks apparaissent automatiquement après connexion
- [ ] Vérifier qu'aucun doublon n'est créé
- [ ] Vérifier que les tâches gardent leur ID Google (préfixe `google-`)

### 3. Ajout de Tâche Locale → Google Tasks

- [ ] Créer une nouvelle tâche dans le TodoWidget
- [ ] Vérifier qu'elle apparaît dans Google Tasks (via l'app ou le site)
- [ ] Vérifier que l'ID local est remplacé par un ID Google lors de la prochaine sync

### 4. Modification de Tâche

- [ ] Modifier le titre d'une tâche synchronisée
- [ ] Vérifier que la modification apparaît dans Google Tasks
- [ ] Modifier la deadline d'une tâche synchronisée
- [ ] Vérifier que la deadline apparaît dans Google Tasks

### 5. Complétion de Tâche

- [ ] Cocher une tâche synchronisée (toggle)
- [ ] Vérifier qu'elle apparaît comme complétée dans Google Tasks
- [ ] Décocher une tâche complétée
- [ ] Vérifier qu'elle apparaît comme non complétée dans Google Tasks

### 6. Suppression de Tâche

- [ ] Supprimer une tâche synchronisée
- [ ] Vérifier qu'elle est supprimée dans Google Tasks

### 7. Synchronisation Bidirectionnelle

- [ ] Créer une tâche sur Google Tasks (via téléphone ou site)
- [ ] Attendre la synchronisation automatique (5 minutes) ou cliquer sur le bouton de sync
- [ ] Vérifier que la tâche apparaît dans le TodoWidget
- [ ] Modifier une tâche sur Google Tasks
- [ ] Vérifier que la modification apparaît dans le TodoWidget

### 8. Indicateur Visuel

- [ ] Vérifier que le bouton de synchronisation apparaît dans le header du TodoWidget
- [ ] Cliquer sur le bouton de synchronisation
- [ ] Vérifier que l'icône tourne pendant la synchronisation
- [ ] Vérifier que le bouton est désactivé pendant la sync
- [ ] Vérifier le tooltip ("Synchronisation en cours..." ou "Synchroniser avec Google Tasks")

### 9. Gestion des Erreurs

- [ ] Déconnecter Google OAuth pendant une synchronisation
- [ ] Vérifier qu'un message d'erreur approprié s'affiche
- [ ] Simuler une erreur réseau (désactiver le WiFi momentanément)
- [ ] Vérifier que le retry automatique fonctionne (3 tentatives)

### 10. Gestion de la Liste

- [ ] Vérifier que la liste par défaut `@default` est utilisée
- [ ] Vérifier qu'aucune nouvelle liste "Dashboard Personnel" n'est créée à chaque sync
- [ ] Vérifier que le `taskListId` est persisté dans localStorage

## 🔍 Points d'Attention

1. **Doublons** : Vérifier qu'aucune tâche n'est dupliquée lors des synchronisations
2. **IDs** : Les tâches Google doivent avoir un ID préfixé par `google-`
3. **Timing** : La synchronisation automatique se fait toutes les 5 minutes
4. **Console** : Vérifier les logs dans la console pour débugger si nécessaire

## 🐛 Bugs à Reporter

Si vous rencontrez des problèmes, notez :

- Quelle opération a échoué
- Le message d'erreur (console + toast)
- Les étapes pour reproduire le bug
- Capture d'écran si possible
