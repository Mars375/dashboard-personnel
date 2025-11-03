/**
 * Calcule la variante de taille d'un widget basée sur ses dimensions
 * 
 * 3 tailles distinctes :
 * - compact : Version ultra compacte, maximum d'info visible dans un minimum d'espace
 * - medium : Version intermédiaire avec fonctionnalités essentielles
 * - full : Version complète avec toutes les fonctionnalités
 */
export type WidgetSize = "compact" | "medium" | "full";

interface SizeCalculation {
	w: number;
	h: number;
}

/**
 * Détermine la taille d'un widget en fonction de ses dimensions
 * @param size Dimensions du widget (w, h)
 * @param widgetType Type de widget (optionnel, pour logique spécifique)
 * @returns Variante de taille : compact, medium, ou full
 */
export function calculateWidgetSize(size: SizeCalculation, widgetType?: string): WidgetSize {
	// Logique spécifique pour CalendarWidget : basée sur la hauteur
	if (widgetType === "calendar") {
		if (size.h <= 3) {
			return "compact";
		} else if (size.h <= 6) {
			return "medium";
		} else {
			return "full";
		}
	}

	// Logique par défaut basée sur l'aire (w * h)
	const area = size.w * size.h;

	// Seuils basés sur l'aire (w * h)
	// Compact : très petite taille (ex: 2x3, 3x3, 3x4)
	// Medium : taille intermédiaire (ex: 4x4, 4x5, 5x4)
	// Full : grande taille (ex: 6x6, 8x4, etc.)

	if (area <= 12) {
		// Ex: 2x3=6, 3x3=9, 3x4=12 = compact
		return "compact";
	} else if (area <= 30) {
		// Ex: 4x4=16, 4x6=24, 5x5=25, 5x6=30 = medium
		return "medium";
	} else {
		// Ex: 6x6=36, 8x4=32, etc. = full
		return "full";
	}
}

/**
 * Props communes à tous les widgets
 */
export interface WidgetProps {
	size?: WidgetSize;
	width?: number; // en colonnes
	height?: number; // en lignes
}

