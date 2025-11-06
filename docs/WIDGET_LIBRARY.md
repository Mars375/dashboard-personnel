# 📚 Bibliothèque de Widgets - Guide Complet

## 🎯 Vue d'Ensemble

Le Dashboard Personnel supporte un système de **bibliothèque de widgets** qui permet d'ajouter des widgets personnalisés depuis des sources externes. Vous pouvez créer vos propres widgets, les importer depuis des URLs, ou partager des bibliothèques de widgets avec d'autres utilisateurs.

## 🏗️ Architecture

Le système de bibliothèque de widgets est composé de :

- **`widgetLibrary.ts`** : Gestionnaire principal de la bibliothèque
- **`widgetLoader.ts`** : Chargeur de modules JavaScript externes
- **`widgetStorage.ts`** : Persistance des widgets et bibliothèques
- **`widgetValidator.ts`** : Validation des widgets et bibliothèques
- **`types.ts`** : Types TypeScript pour les widgets externes

## 📦 Créer un Widget Personnalisé

### Structure d'un Widget

Un widget personnalisé doit être un module JavaScript/TypeScript qui exporte un composant React :

```typescript
// MonWidget.tsx
import type { WidgetProps } from "@dashboard-personnel/widget-types";

export default function MonWidget({ size = "medium" }: WidgetProps) {
  return (
    <div>
      <h2>Mon Widget Personnalisé</h2>
      <p>Taille: {size}</p>
    </div>
  );
}
```

### Format de Définition

Pour ajouter un widget, vous devez fournir une définition JSON :

```json
{
  "id": "mon-widget",
  "name": "Mon Widget",
  "description": "Description courte du widget",
  "detailedDescription": "Description détaillée avec toutes les fonctionnalités",
  "usageGuide": "Guide d'utilisation étape par étape",
  "features": [
    "Fonctionnalité 1",
    "Fonctionnalité 2"
  ],
  "icon": "https://example.com/icon.svg",
  "moduleUrl": "https://example.com/widgets/mon-widget.js",
  "defaultSize": { "w": 4, "h": 6 },
  "minSize": { "w": 2, "h": 3 },
  "maxSize": { "w": 8, "h": 10 },
  "version": "1.0.0",
  "author": "Votre Nom",
  "license": "MIT",
  "tags": ["productivité", "personnel"]
}
```

### Propriétés Requises

- **`id`** : Identifiant unique (doit être différent des widgets internes)
- **`name`** : Nom d'affichage
- **`description`** : Description courte
- **`moduleUrl`** : URL du module JavaScript à charger
- **`defaultSize`** : Taille par défaut `{ w: number, h: number }`
- **`minSize`** : Taille minimale `{ w: number, h: number }`

### Propriétés Optionnelles

- **`detailedDescription`** : Description détaillée
- **`usageGuide`** : Guide d'utilisation
- **`features`** : Liste des fonctionnalités
- **`icon`** : URL de l'icône ou nom d'icône Lucide
- **`maxSize`** : Taille maximale
- **`version`** : Version du widget
- **`author`** : Auteur
- **`license`** : Licence
- **`tags`** : Tags pour la recherche

## 🚀 Importer un Widget

### Méthode 1 : Via l'Interface Utilisateur

1. Ouvrez le **Widget Picker** (bouton "+" dans le dashboard)
2. Cliquez sur **"Bibliothèque de widgets"**
3. Cliquez sur **"Ajouter un widget"**
4. Entrez l'URL du widget ou collez la définition JSON
5. Cliquez sur **"Importer"**

### Méthode 2 : Via le Code

```typescript
import { widgetLibrary } from "@/lib/widgetLibrary";

// Ajouter un widget personnalisé
await widgetLibrary.addCustomWidget({
  id: "mon-widget",
  name: "Mon Widget",
  description: "Description",
  moduleUrl: "https://example.com/widget.js",
  defaultSize: { w: 4, h: 6 },
  minSize: { w: 2, h: 3 },
});
```

## 📚 Créer une Bibliothèque de Widgets

Une bibliothèque de widgets est une collection de widgets regroupés ensemble :

```json
{
  "id": "ma-bibliotheque",
  "name": "Ma Bibliothèque de Widgets",
  "description": "Collection de widgets personnalisés",
  "version": "1.0.0",
  "author": "Votre Nom",
  "url": "https://example.com/widget-library.json",
  "widgets": [
    {
      "id": "widget-1",
      "name": "Widget 1",
      "description": "Premier widget",
      "moduleUrl": "https://example.com/widgets/widget-1.js",
      "defaultSize": { "w": 4, "h": 6 },
      "minSize": { "w": 2, "h": 3 }
    },
    {
      "id": "widget-2",
      "name": "Widget 2",
      "description": "Deuxième widget",
      "moduleUrl": "https://example.com/widgets/widget-2.js",
      "defaultSize": { "w": 3, "h": 4 },
      "minSize": { "w": 2, "h": 2 }
    }
  ]
}
```

### Importer une Bibliothèque

```typescript
// Depuis une URL
await widgetLibrary.loadLibraryFromUrl("https://example.com/library.json");

// Depuis le code
import { addWidgetLibrary } from "@/lib/widgetLibrary/widgetStorage";

addWidgetLibrary({
  id: "ma-bibliotheque",
  name: "Ma Bibliothèque",
  widgets: [/* ... */]
});
```

## 🛠️ Développement d'un Widget

### Prérequis

- **React 19+** : Le widget doit être compatible avec React 19
- **TypeScript** : Recommandé pour le développement
- **WidgetProps** : Le composant doit accepter les props `WidgetProps`

### Interface WidgetProps

```typescript
interface WidgetProps {
  size?: "compact" | "medium" | "full";
  // Autres props personnalisées peuvent être ajoutées
}
```

### Exemple Complet

```typescript
// MonWidget.tsx
import React from "react";
import type { WidgetProps } from "@dashboard-personnel/widget-types";

export default function MonWidget({ size = "medium" }: WidgetProps) {
  const isCompact = size === "compact";
  const isMedium = size === "medium";
  const isFull = size === "full";

  return (
    <div className={`p-${isCompact ? "2" : isMedium ? "3" : "4"}`}>
      <h2 className="text-lg font-bold">Mon Widget</h2>
      {isFull && (
        <div>
          <p>Contenu complet visible uniquement en mode full</p>
        </div>
      )}
      {isMedium && (
        <div>
          <p>Contenu medium</p>
        </div>
      )}
      {isCompact && (
        <div>
          <p>Version compacte</p>
        </div>
      )}
    </div>
  );
}
```

### Build et Distribution

Pour distribuer votre widget :

1. **Build votre widget** :
   ```bash
   # Avec Vite
   vite build --format es
   
   # Avec Webpack
   webpack --mode production
   ```

2. **Hébergez le fichier** : Mettez le fichier `.js` sur un serveur web accessible

3. **Créez la définition JSON** : Créez un fichier JSON avec la définition du widget

4. **Partagez** : Partagez l'URL du widget ou la définition JSON

## 🔌 Utiliser les APIs du Dashboard

Vos widgets peuvent utiliser les APIs disponibles du dashboard :

### WidgetContext

Permet de partager des données entre widgets :

```typescript
import { useWidgetContext } from "@dashboard-personnel/widget-context";

function MonWidget() {
  const { publishData, subscribe, getData } = useWidgetContext();
  
  // Publier des données
  publishData("mon-widget", "stocks", { stocks: [...] });
  
  // S'abonner aux données
  useEffect(() => {
    const unsubscribe = subscribe("stocks", (data) => {
      console.log("Données reçues:", data);
    });
    return unsubscribe;
  }, [subscribe]);
  
  // Récupérer les données actuelles
  const stocksData = getData("stocks");
}
```

### Storage

Utiliser le localStorage pour persister des données :

```typescript
// Sauvegarder
localStorage.setItem("mon-widget:data", JSON.stringify(data));

// Charger
const data = JSON.parse(localStorage.getItem("mon-widget:data") || "{}");
```

## ✅ Validation

Les widgets sont automatiquement validés lors de l'import :

- **ID unique** : Ne doit pas être utilisé par un widget interne ou externe
- **Format valide** : Toutes les propriétés requises doivent être présentes
- **Tailles valides** : `minSize` ≤ `defaultSize` ≤ `maxSize` (si défini)
- **URL valide** : `moduleUrl` doit être une URL valide

## 🐛 Dépannage

### Widget ne se charge pas

- Vérifiez que l'URL `moduleUrl` est accessible
- Vérifiez que le module exporte bien un composant par défaut
- Vérifiez la console du navigateur pour les erreurs

### Widget ne s'affiche pas

- Vérifiez que le composant accepte les props `WidgetProps`
- Vérifiez que le composant est compatible avec React 19
- Vérifiez les erreurs dans la console

### Erreur de validation

- Vérifiez que toutes les propriétés requises sont présentes
- Vérifiez que l'ID est unique
- Vérifiez que les tailles sont valides

## 📖 Exemples

### Widget Simple

```typescript
// SimpleWidget.tsx
export default function SimpleWidget({ size }: WidgetProps) {
  return <div>Widget Simple - Taille: {size}</div>;
}
```

### Widget avec État

```typescript
// CounterWidget.tsx
import { useState } from "react";

export default function CounterWidget({ size }: WidgetProps) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Compteur: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### Widget avec API

```typescript
// ApiWidget.tsx
import { useState, useEffect } from "react";

export default function ApiWidget({ size }: WidgetProps) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch("https://api.example.com/data")
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{data ? JSON.stringify(data) : "Chargement..."}</div>;
}
```

## 🔒 Sécurité

⚠️ **Important** : Les widgets externes sont chargés depuis des URLs externes. Assurez-vous de :

- Ne charger que des widgets depuis des sources de confiance
- Vérifier le code source des widgets avant de les importer
- Utiliser HTTPS pour les URLs de widgets
- Examiner les permissions demandées par les widgets

## 📚 Ressources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)

## 🎯 Prochaines Étapes

1. Créez votre widget
2. Testez-le localement
3. Build et hébergez-le
4. Créez la définition JSON
5. Importez-le dans le dashboard
6. Partagez-le avec la communauté !

---

*Pour plus d'informations, consultez la documentation complète dans `docs/WIDGETS.md`*

