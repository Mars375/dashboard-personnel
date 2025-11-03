# 📐 Système de tailles adaptatives pour les widgets

## Vue d'ensemble

Les widgets du dashboard s'adaptent automatiquement à leur taille dans la grille. Le système calcule une variante (`compact`, `normal`, ou `full`) basée sur les dimensions (largeur × hauteur) du widget.

## Calcul des tailles

Le système utilise l'aire du widget (largeur × hauteur) pour déterminer la variante :

- **Compact** : aire ≤ 12 (ex: 3×3, 3×4, 4×3)
- **Normal** : 12 < aire ≤ 24 (ex: 4×4, 4×6, 6×4)
- **Full** : aire > 24 (ex: 6×6, 8×4)

## Props des widgets

Tous les widgets reçoivent automatiquement les props suivantes :

```typescript
interface WidgetProps {
  size?: "compact" | "normal" | "full";
  width?: number;  // en colonnes
  height?: number; // en lignes
}
```

## Exemple : WeatherWidget

### Mode Compact (≤ 12) - Layout horizontal optimisé
**Design repensé pour afficher toutes les infos sans scroll :**
- **Ligne supérieure** : Icône (gauche) + Ville/Description (centre) + Température/Min-Max (droite)
- **Ligne inférieure** : Prévisions 5 jours en grille horizontale très compacte
- **Pas de scroll** : Tout visible d'un coup d'œil
- **Espace optimisé** : Textes réduits mais lisibles, icônes compactes

### Mode Normal (12 < aire ≤ 24) - Layout vertical classique
- Icône météo standard (14×14) centrée
- Ville, température, description, min/max
- Bouton refresh
- Prévisions sur 3 jours

### Mode Full (> 24) - Version complète
- Recherche de ville avec autocomplétion
- Toutes les informations
- Bouton refresh
- Prévisions complètes sur 5 jours

## Implémentation

### 1. Widget Registry

Les widgets doivent être typés avec `WidgetProps` :

```typescript
import type { WidgetProps } from "@/lib/widgetSize";

export interface WidgetDefinition {
  component: ComponentType<WidgetProps>;
  // ...
}
```

### 2. Widget Item

`WidgetItem` calcule automatiquement la taille et passe les props au widget :

```typescript
const widgetSize = calculateWidgetSize({ w: layout.w, h: layout.h });

<WidgetComponent
  size={widgetSize}
  width={layout.w}
  height={layout.h}
/>
```

### 3. Dans le widget

```typescript
import type { WidgetProps } from "@/lib/widgetSize";

export function MonWidget({ size = "normal" }: WidgetProps) {
  const isCompact = size === "compact";
  const isFull = size === "full";

  return (
    <Card>
      {isFull && <Recherche />}
      <ContenuPrincipal />
      {!isCompact && <Details />}
      {isFull && <OptionsAvancees />}
    </Card>
  );
}
```

## Recommandations

### Pour les développeurs de widgets

1. **Toujours accepter `WidgetProps`** avec valeur par défaut `"normal"`
2. **Repenser complètement le layout** pour le mode compact (pas juste cacher)
3. **Prioriser l'horizontalité** en mode compact pour utiliser l'espace largeur
4. **Éliminer le scroll** : tout doit être visible dans la hauteur disponible
5. **Densifier l'information** : grilles plus denses, textes plus petits mais lisibles
6. **Afficher les fonctionnalités avancées** uniquement en mode full
7. **Tester avec différentes tailles** pour vérifier la lisibilité et l'absence de scroll

### Exemple de structure

```typescript
export function MonWidget({ size = "normal" }: WidgetProps) {
  const isCompact = size === "compact";
  const isFull = size === "full";
  
  // Variables adaptatives
  const padding = isCompact ? "p-2" : "p-4";
  const overflow = isCompact ? "overflow-hidden" : "overflow-auto";
  
  return (
    <Card className={`${padding} ${overflow} h-full flex flex-col`}>
      {isCompact ? (
        // Layout horizontal optimisé - TOUT visible sans scroll
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Icon />
            <InfosPrincipales />
            <Statistiques />
          </div>
          <DetailsCompacts />
        </div>
      ) : (
        // Layout vertical classique
        <>
          <InfosPrincipales />
          {isFull && <OptionsAvancees />}
          <Details />
        </>
      )}
    </Card>
  );
}
```

### Principes de design compact

1. **Tout visible d'un coup** : Pas de scroll, tout doit tenir dans la hauteur disponible
2. **Layout horizontal** : Utiliser l'espace largeur plutôt que hauteur
3. **Infos essentielles en premier** : Les données les plus importantes en haut/gauche
4. **Textes compacts mais lisibles** : `text-xs` minimum, `text-[10px]` pour détails
5. **Espacement minimal** : `gap-0.5`, `gap-1` au lieu de `gap-2`, `gap-3`
6. **Grilles denses** : Plus de colonnes, moins d'espace entre éléments

## Widgets supportés

- ✅ **WeatherWidget** : Recherche (full), prévisions (normal/full), détails complets
- 🔄 **TodoWidget** : À implémenter
- 🔄 **CalendarWidget** : À implémenter

## Ajustements futurs

- Ajuster les seuils selon le feedback utilisateur
- Ajouter une variante "tiny" pour widgets très petits
- Permettre aux utilisateurs de choisir la variante manuellement
- Animations de transition entre les variantes

