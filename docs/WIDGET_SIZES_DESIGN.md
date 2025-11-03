# Design des 3 Tailles de Widgets

## Philosophie générale

Chaque widget a maintenant **3 versions distinctes** :

1. **COMPACT** : Ultra compacte, maximum d'informations visibles dans un minimum d'espace
   - Aucun scroll, tout visible d'un coup d'œil
   - Layout horizontal priorisé
   - Textes minimaux mais lisibles
   - Fonctionnalités essentielles uniquement

2. **MEDIUM** : Intermédiaire avec fonctionnalités essentielles
   - Layout équilibré vertical/horizontal
   - Fonctionnalités principales accessibles
   - Navigation/actions simplifiées mais complètes

3. **FULL** : Version complète (actuelle)
   - Toutes les fonctionnalités
   - Recherche, export, import, sync
   - Statistiques avancées
   - Personnalisation complète

---

## WeatherWidget

### COMPACT (≤ 12 unités)
**Objectif** : Afficher la météo actuelle + prévisions ultra compactes, tout visible sans scroll

**Layout** :
```
┌─────────────────────────────┐
│ 🌤️  Paris      22°C        │
│    Nuageux     15°/18°     │
│─────────────────────────────│
│ L  M  M  J  V               │
│ 🌧️  ☀️  🌤️  ☀️  🌤️         │
│ 16° 18° 17° 19° 18°         │
└─────────────────────────────┘
```

**Contenu** :
- Ligne 1 : Icône (8x8) + Ville + Température actuelle (gros)
- Ligne 2 : Description + Min/Max (petit texte)
- Ligne 3 : Prévisions 5 jours en grille horizontale (icône mini + temp)

**Pas de** : Recherche, refresh, détails supplémentaires

### MEDIUM (12 < aire ≤ 30)
**Objectif** : Météo complète avec quelques actions essentielles

**Layout** :
```
┌─────────────────────────────┐
│ [Recherche] [Refresh]       │
│                             │
│        🌤️ (icône 14x14)     │
│       Paris, France         │
│         22°C                │
│     Nuageux                 │
│     Min 15° · Max 18°       │
│                             │
│  [L] [M] [M] [J] [V]        │
│  🌧️  ☀️  🌤️  ☀️  🌤️        │
│  16° 18° 17° 19° 18°        │
│  13° 15° 14° 16° 15°        │
└─────────────────────────────┘
```

**Contenu** :
- Input recherche compact (ou icône popover)
- Bouton refresh visible
- Météo actuelle centrée, bien lisible
- Prévisions 5 jours avec icônes + min/max

**Pas de** : Statistiques avancées, historique détaillé

### FULL (> 30)
**Version actuelle** :
- Recherche complète avec autocomplétion
- Tous les détails (pays, fuseau horaire, etc.)
- Prévisions détaillées
- Bouton refresh
- Statistiques complètes

---

## TodoWidget

### COMPACT (≤ 12 unités)
**Objectif** : Voir rapidement les tâches prioritaires + ajout rapide

**Layout** :
```
┌─────────────────────────────┐
│ Liste    3 actives ⭐2      │
│ ████████░░ 80%              │
│─────────────────────────────│
│ [✓] Tâche 1      ×          │
│ [✓] Tâche 2      ×          │
│ [ ] Tâche 3 ⚠    ×          │
│ [ ] Tâche 4      ×          │
│ +3 autres...                 │
│─────────────────────────────│
│ [Nouvelle tâche...] [+]     │
└─────────────────────────────┘
```

**Contenu** :
- Header : Nom liste + compteurs (actives, prioritaires)
- Progress bar fine (h-1)
- Liste max 4-5 tâches visibles (scroll si plus)
- Chaque tâche : checkbox + texte tronqué + deadline si urgent + ×
- Input ajout en bas, compact (h-6)

**Pas de** : Filtres, recherche, stats, export/import, multi-listes

### MEDIUM (12 < aire ≤ 30)
**Objectif** : Gestion complète des tâches sans surcharge

**Layout** :
```
┌─────────────────────────────┐
│ [Liste ▼]  [📊] [📤] [↩]   │
│ Progression         80%    │
│ ████████░░                   │
│ 3 actives · 2 terminées      │
│─────────────────────────────│
│ [🔍] (icône recherche)      │
│─────────────────────────────│
│ [Nouvelle tâche...] [+]     │
│ [Toutes] [Actives] [Term.]  │
│─────────────────────────────│
│ [✓] Tâche 1          ⭐ ✏ × │
│ [✓] Tâche 2          ✏ ×    │
│ [ ] Tâche 3 ⚠        ⭐ ✏ × │
│ ... (scroll)                │
└─────────────────────────────┘
```

**Contenu** :
- Sélecteur liste + quelques actions essentielles (stats, export, undo)
- Progress bar + compteurs
- Recherche par icône (popover)
- Input ajout
- Filtres compacts (3 boutons)
- Liste complète avec actions (hover)
- Scroll si nécessaire

**Pas de** : Stats détaillées (charts), sync, notifications, import

### FULL (> 30)
**Version actuelle** :
- Toutes les fonctionnalités
- Recherche complète
- Stats avec charts
- Export/Import JSON
- Sync externe
- Notifications
- Multi-listes complètes
- Undo/Redo

---

## CalendarWidget

### COMPACT (≤ 12 unités)
**Objectif** : Voir rapidement le calendrier + événements du jour sélectionné

**Layout** :
```
┌─────────────────────────────┐
│        📅 Calendrier        │
│   [Janvier 2025]            │
│  L  M  M  J  V  S  D        │
│         1  2  3  4  5       │
│  6  7  8  9 10 11 12        │
│ 13 14[15]16 17 18 19        │
│ 20 21 22 23 24 25 26        │
│─────────────────────────────│
│ 15 jan                      │
│ 09:00 Meeting       ×       │
│ 14:30 Rendez-vous   ×       │
│ +2 autres...                 │
└─────────────────────────────┘
```

**Contenu** :
- Calendrier minimal, centré, taille réduite
- Navigation mois (dropdown ou flèches)
- Jours avec points si événements
- Footer : Date sélectionnée + max 3 événements du jour
- Format ultra compact (text-[10px])

**Pas de** : Recherche, vues semaine/jour, boutons actions, export/import

### MEDIUM (12 < aire ≤ 30)
**Objectif** : Calendrier complet avec gestion basique des événements

**Layout** :
```
┌─────────────────────────────┐
│ [Vue ▼] [📥] [🔄] [🔔]     │
│ [Aujourd'hui]               │
│─────────────────────────────│
│      📅 Calendrier          │
│   [Janvier 2025 ▼]          │
│  L  M  M  J  V  S  D        │
│         1  2  3  4  5       │
│  6  7  8  9 10 11 12        │
│ 13 14[15]16 17 18 19        │
│ 20 21 22 23 24 25 26        │
│─────────────────────────────│
│ 15 janvier 2025      [+]    │
│ ┌─────────────────────┐    │
│ │ 09:00 Meeting        │    │
│ │ 14:30 Rendez-vous    │    │
│ │ 18:00 Diner         │    │
│ └─────────────────────┘    │
└─────────────────────────────┘
```

**Contenu** :
- Sélecteur vue (mois/semaine/jour)
- Quelques actions (export, sync, notif)
- Bouton "Aujourd'hui"
- Calendrier adaptatif (max-width pour éviter trop d'espace)
- Footer : Date + événements du jour format style Calendar31
- Bouton + pour ajouter événement

**Pas de** : Recherche, import, vues avancées semaine/jour détaillées

### FULL (> 30)
**Version actuelle** :
- Recherche complète
- Toutes les vues (mois/semaine/jour)
- Export/Import (JSON + ICS)
- Drag & drop complet
- Répétition, rappels
- Sync externe
- Notifications complètes

---

## Implémentation

### Variables CSS communes

```typescript
const isCompact = size === "compact";
const isMedium = size === "medium";
const isFull = size === "full";

// Padding
const padding = isCompact ? "p-1.5" : isMedium ? "p-3" : "p-4";

// Gaps
const gap = isCompact ? "gap-1" : isMedium ? "gap-2" : "gap-3";

// Text sizes
const textTitle = isCompact ? "text-xs" : isMedium ? "text-sm" : "text-base";
const textBody = isCompact ? "text-[10px]" : isMedium ? "text-xs" : "text-sm";

// Overflow
const overflow = isCompact ? "overflow-hidden" : "overflow-auto";
```

### Structure conditionnelle

```typescript
{isCompact ? (
  // Layout COMPACT
) : isMedium ? (
  // Layout MEDIUM
) : (
  // Layout FULL (version actuelle)
)}
```




