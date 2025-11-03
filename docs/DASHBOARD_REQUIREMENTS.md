# 🎯 Dashboard Dynamique & Personnalisable - Feuille de route

## 📋 Vue d'ensemble

Créer une vue principale de dashboard entièrement interactive et personnalisable, permettant à l'utilisateur de composer son propre espace de travail avec les widgets disponibles (Weather, Todo, Calendar, etc.).

---

## ✨ Fonctionnalités principales

### 1. 🔲 Grille entièrement interactive

#### **Drag & Drop**

- ✅ **Déplacement libre** : Les widgets peuvent être glissés-déposés n'importe où dans la grille
- ✅ **Pas de collisions** : La grille réorganise automatiquement les autres widgets
- ✅ **Feedback visuel** : Indication claire pendant le drag (opacité, ombre, etc.)

#### **Redimensionnement**

- ✅ **Resize handles** : Chaque widget a des poignées de redimensionnement (coin, bords)
- ✅ **Contraintes** : Taille minimale/maximale par type de widget
- ✅ **Multi-tailles** : Largeur ET hauteur configurables indépendamment
- ✅ **Feedback visuel** : Aperçu de la nouvelle taille pendant le resize

#### **Positions et dimensions**

- ✅ **Système de grille** : Basé sur des colonnes/lignes (grid system)
- ✅ **Coordonnées précises** : x, y, width, height en unités de grille
- ✅ **Pas de chevauchement** : Les widgets ne peuvent pas se superposer

---

### 2. 💾 Persistance du layout

#### **Sauvegarde**

- ✅ **localStorage** : Sauvegarde automatique de la position et taille de chaque widget
- ✅ **Structure JSON** : Format clair et exportable
- ✅ **Sauvegarde déclenchée** : Après chaque modification (drag, resize, ajout, suppression)

#### **Restauration**

- ✅ **Chargement au reload** : Le layout est automatiquement restauré au chargement de la page
- ✅ **Fallback** : Layout par défaut si aucun layout sauvegardé
- ✅ **Validation** : Vérifier que les widgets sauvegardés existent toujours

#### **Gestion des données**

```typescript
interface WidgetLayout {
	id: string; // ID unique du widget
	type: string; // "weather" | "todo" | "calendar"
	x: number; // Position X en colonnes
	y: number; // Position Y en lignes
	w: number; // Largeur en colonnes
	h: number; // Hauteur en lignes
	minW?: number; // Largeur minimale
	minH?: number; // Hauteur minimale
	maxW?: number; // Largeur maximale
	maxH?: number; // Hauteur maximale
}
```

---

### 3. 🎨 Personnalisation UI/UX

#### **Widget Library / Picker**

- ✅ **Menu d'ajout** : Bouton "+" ou menu pour ajouter des widgets
- ✅ **Liste des widgets disponibles** : Afficher tous les widgets possibles
- ✅ **Indicateur** : Marquer les widgets déjà ajoutés
- ✅ **Filtre** : Recherche/filtrage dans la bibliothèque
- ✅ **Preview** : Aperçu ou icône pour chaque widget

#### **Gestion des widgets**

- ✅ **Ajout dynamique** : Ajouter un widget sans refresh de la page
- ✅ **Suppression** : Bouton de suppression sur chaque widget (optionnel : confirmation)
- ✅ **Réorganisation** : Drag & drop pour changer l'ordre

#### **Thème & personnalisation** (Optionnel)

- ⚠️ Choix du thème (light/dark) - déjà géré globalement ?
- ⚠️ Palette de couleurs - à voir si nécessaire
- ⚠️ Fond personnalisé - optionnel pour plus tard

---

### 4. 🔌 Composabilité (Plug & Play)

#### **Widgets indépendants**

- ✅ **Isolation** : Chaque widget fonctionne indépendamment
- ✅ **Pas de dépendances** : Ajouter/supprimer un widget n'affecte pas les autres
- ✅ **Lifecycle** : Mount/unmount propre lors de l'ajout/suppression

#### **Communication inter-widgets** (si nécessaire)

- ⚠️ **Events** : Système d'événements pour communication
- ⚠️ **Zustand global** : Store partagé pour données communes
- ⚠️ **Context API** : Pour partager certaines infos

**Exemple** : Todo widget peut afficher les deadlines dans Calendar widget

---

### 5. 📱 Responsive Design

#### **Breakpoints**

- ✅ **Desktop** : Layout complet avec toutes les colonnes
- ✅ **Tablet** : Adaptation du nombre de colonnes
- ✅ **Mobile** : Stack vertical des widgets (ou layout simplifié)

#### **Adaptation automatique**

- ✅ **Responsive** : react-grid-layout gère automatiquement les breakpoints
- ✅ **Réorganisation** : Les widgets s'adaptent selon la taille d'écran
- ✅ **Touch-friendly** : Drag & drop fonctionne sur mobile/tablet

---

## 🛠️ Stack technique

### Librairies principales

1. **react-grid-layout** ✅ Installé

   - Grille drag & drop
   - Redimensionnement automatique
   - Breakpoints responsive
   - Gestion des collisions

2. **zustand** ✅ Déjà dans le projet

   - Store pour le layout
   - État global des widgets
   - Persistance intégrée

3. **Shadcn UI** ✅ Déjà utilisé
   - Dialog pour widget picker
   - Button pour actions
   - Card pour conteneur de widgets
   - Command pour recherche dans picker

### Structure de fichiers à créer

```
src/
├── components/
│   └── Dashboard/
│       ├── Dashboard.tsx              # Composant principal
│       ├── WidgetGrid.tsx             # Grille react-grid-layout
│       ├── WidgetItem.tsx             # Wrapper pour chaque widget
│       ├── WidgetPicker.tsx           # Dialog pour choisir/ajouter widgets
│       └── WidgetControls.tsx         # Boutons supprimer/paramètres par widget
├── store/
│   └── dashboardStore.ts             # Zustand store pour layout
└── lib/
    └── widgetRegistry.ts              # Registre des widgets disponibles
```

---

## 📐 Spécifications techniques

### Layout par défaut

```typescript
const defaultLayout: WidgetLayout[] = [
	{ id: "weather-1", type: "weather", x: 0, y: 0, w: 4, h: 3 },
	{ id: "todo-1", type: "todo", x: 4, y: 0, w: 4, h: 6 },
	{ id: "calendar-1", type: "calendar", x: 8, y: 0, w: 4, h: 6 },
];
```

### Taille de grille

- **Desktop** : 12 colonnes (standard)
- **Tablet** : 8 colonnes
- **Mobile** : 4 colonnes (ou stack vertical)

### Dimensions par widget

```typescript
const widgetSizes = {
	weather: { minW: 3, minH: 3, defaultW: 4, defaultH: 3 },
	todo: { minW: 3, minH: 4, defaultW: 4, defaultH: 6 },
	calendar: { minW: 3, minH: 5, defaultW: 4, defaultH: 6 },
};
```

---

## 🎯 Workflow utilisateur

### Ajouter un widget

1. Utilisateur clique sur bouton "+" ou "Ajouter widget"
2. Dialog s'ouvre avec la liste des widgets disponibles
3. Utilisateur sélectionne un widget (ex: "Calendar")
4. Le widget est ajouté à la grille (position automatique ou choix)
5. Layout sauvegardé automatiquement

### Déplacer un widget

1. Utilisateur clique et maintient sur un widget
2. Widget devient draggable (feedback visuel)
3. Utilisateur déplace vers nouvelle position
4. Grille réorganise automatiquement
5. Layout sauvegardé automatiquement

### Redimensionner un widget

1. Utilisateur survole les bords/corners du widget
2. Curseur change pour indiquer resize
3. Utilisateur drag pour redimensionner
4. Contraintes min/max respectées
5. Layout sauvegardé automatiquement

### Supprimer un widget

1. Bouton "X" ou menu contextuel sur le widget
2. (Optionnel) Confirmation dialog
3. Widget retiré de la grille
4. Layout sauvegardé automatiquement

---

## 🔄 États et données

### Store Zustand

```typescript
interface DashboardState {
	// Layout actuel
	widgets: WidgetLayout[];

	// Actions
	addWidget: (type: string, position?: { x: number; y: number }) => void;
	removeWidget: (id: string) => void;
	updateLayout: (layouts: Layout[]) => void;

	// Persistance
	loadLayout: () => void;
	saveLayout: () => void;

	// Widget picker
	isPickerOpen: boolean;
	openPicker: () => void;
	closePicker: () => void;
}
```

### Registre des widgets

```typescript
interface WidgetDefinition {
	id: string;
	name: string;
	description: string;
	icon: React.ComponentType;
	component: React.ComponentType;
	defaultSize: { w: number; h: number };
	minSize: { w: number; h: number };
	maxSize: { w: number; h: number };
}

const widgetRegistry: WidgetDefinition[] = [
	{
		id: "weather",
		name: "Météo",
		description: "Affiche la météo actuelle",
		component: WeatherWidget,
		// ...
	},
	// ...
];
```

---

## 📱 Responsive Breakpoints

```typescript
const breakpoints = {
	lg: 1200, // Desktop
	md: 996, // Tablet
	sm: 768, // Mobile landscape
	xs: 480, // Mobile portrait
	xxs: 0, // Tiny mobile
};

const cols = {
	lg: 12,
	md: 10,
	sm: 6,
	xs: 4,
	xxs: 2,
};
```

---

## 🎨 Design & UX

### Apparence

- **Grille invisible** : Pas de lignes visibles, juste le spacing
- **Spacing cohérent** : Gap entre widgets (16px par exemple)
- **Animations fluides** : Transitions sur drag/resize
- **Feedback visuel** : Indicateurs clairs pour les actions

### Widgets

- **Bordure subtile** : Optionnel, pour délimiter
- **Header avec titre** : Parfois utile pour identifier
- **Bouton fermer** : Sur hover ou toujours visible
- **Style cohérent** : Même look que les widgets individuels

---

## ✅ Checklist d'implémentation

### Phase 1 : Structure de base

- [ ] Installer react-grid-layout ✅
- [ ] Créer store Zustand pour layout
- [ ] Créer widget registry
- [ ] Créer composant Dashboard de base

### Phase 2 : Grille interactive

- [ ] Intégrer react-grid-layout
- [ ] Configurer drag & drop
- [ ] Configurer resize handles
- [ ] Définir contraintes min/max par widget

### Phase 3 : Persistance

- [ ] Sauvegarder layout dans localStorage
- [ ] Charger layout au mount
- [ ] Gérer les erreurs de chargement

### Phase 4 : Widget Picker

- [ ] Créer dialog de sélection
- [ ] Afficher widgets disponibles
- [ ] Ajouter widget à la grille
- [ ] Indiquer widgets déjà ajoutés

### Phase 5 : Gestion widgets

- [ ] Bouton supprimer par widget
- [ ] Confirmation avant suppression
- [ ] Prévention suppression du dernier widget

### Phase 6 : Responsive

- [ ] Configurer breakpoints
- [ ] Adapter colonnes selon taille
- [ ] Tester sur différentes tailles

### Phase 7 : Polish & UX

- [ ] Animations fluides
- [ ] Feedback visuel
- [ ] Gestion erreurs
- [ ] Tests

---

## 💡 Notes importantes

1. **Performance** : Limiter le nombre de widgets (max 10-15 ?)
2. **Accessibilité** : Raccourcis clavier, ARIA labels
3. **Mobile** : Touch events pour drag & drop
4. **Export/Import** : Permettre sauvegarde/restauration manuelle (bonus)
5. **Thèmes** : S'adapter au thème global (dark/light)

---

## 🚀 Prêt à implémenter !

Cette structure permet un dashboard entièrement personnalisable où l'utilisateur compose son espace de travail exactement comme il le souhaite.



