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
 * Tailles fixes pour les widgets
 * Ces tailles sont utilisées pour déterminer quelle variante afficher
 */
export const WIDGET_SIZE_THRESHOLDS = {
	compact: {
		maxW: 3,
		maxH: 3,
		maxArea: 9, // 3x3 = 9 (réduit pour version plus compacte)
	},
	medium: {
		maxW: 5,
		maxH: 6,
		maxArea: 30, // 5x6 = 30
	},
	full: {
		minArea: 31, // > 30
	},
} as const;

/**
 * Détermine la taille d'un widget en fonction de ses dimensions fixes
 * @param size Dimensions du widget (w, h)
 * @param _widgetType Type de widget (déprécié, conservé pour compatibilité)
 * @returns Variante de taille : compact, medium, ou full
 */
export function calculateWidgetSize(size: SizeCalculation, _widgetType?: string): WidgetSize {
	const area = size.w * size.h;

	// Tailles fixes définies :
	// - Compact : w ≤ 3 ET h ≤ 3 ET aire ≤ 9 (ex: 2x3, 3x3)
	// - Medium : w ≤ 5 ET h ≤ 6 ET aire ≤ 30 (mais pas compact) (ex: 4x4, 4x5, 4x6, 5x5, 5x6)
	// - Full : tout le reste (w > 5 OU h > 6 OU aire > 30) (ex: 6x6, 8x4, 6x8)

	if (
		size.w <= WIDGET_SIZE_THRESHOLDS.compact.maxW &&
		size.h <= WIDGET_SIZE_THRESHOLDS.compact.maxH &&
		area <= WIDGET_SIZE_THRESHOLDS.compact.maxArea
	) {
		return "compact";
	} else if (
		size.w <= WIDGET_SIZE_THRESHOLDS.medium.maxW &&
		size.h <= WIDGET_SIZE_THRESHOLDS.medium.maxH &&
		area <= WIDGET_SIZE_THRESHOLDS.medium.maxArea
	) {
		return "medium";
	} else {
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

