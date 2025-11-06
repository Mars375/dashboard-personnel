import type { ExternalWidgetDefinition, WidgetLibraryMetadata } from "./types";
import { logger } from "@/lib/logger";

const STORAGE_KEY_WIDGETS = "dashboard-widget-library";
const STORAGE_KEY_LIBRARIES = "dashboard-widget-libraries";

/**
 * Charge les widgets personnalisés depuis le localStorage
 */
export function loadCustomWidgets(): ExternalWidgetDefinition[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY_WIDGETS);
		if (!stored) return [];
		return JSON.parse(stored) as ExternalWidgetDefinition[];
	} catch (error) {
		logger.error("Erreur lors du chargement des widgets personnalisés:", error);
		return [];
	}
}

/**
 * Sauvegarde les widgets personnalisés dans le localStorage
 */
export function saveCustomWidgets(widgets: ExternalWidgetDefinition[]): void {
	try {
		localStorage.setItem(STORAGE_KEY_WIDGETS, JSON.stringify(widgets));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des widgets personnalisés:", error);
	}
}

/**
 * Ajoute un widget personnalisé
 */
export function addCustomWidget(widget: ExternalWidgetDefinition): void {
	const widgets = loadCustomWidgets();
	
	// Vérifier si le widget existe déjà
	if (widgets.some((w) => w.id === widget.id)) {
		throw new Error(`Un widget avec l'ID '${widget.id}' existe déjà`);
	}

	// Ajouter la date d'ajout
	const widgetWithDate: ExternalWidgetDefinition = {
		...widget,
		addedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	widgets.push(widgetWithDate);
	saveCustomWidgets(widgets);
}

/**
 * Met à jour un widget personnalisé
 */
export function updateCustomWidget(widgetId: string, updates: Partial<ExternalWidgetDefinition>): void {
	const widgets = loadCustomWidgets();
	const index = widgets.findIndex((w) => w.id === widgetId);

	if (index === -1) {
		throw new Error(`Widget '${widgetId}' introuvable`);
	}

	widgets[index] = {
		...widgets[index],
		...updates,
		updatedAt: new Date().toISOString(),
	};

	saveCustomWidgets(widgets);
}

/**
 * Supprime un widget personnalisé
 */
export function removeCustomWidget(widgetId: string): void {
	const widgets = loadCustomWidgets();
	const filtered = widgets.filter((w) => w.id !== widgetId);
	
	if (filtered.length === widgets.length) {
		throw new Error(`Widget '${widgetId}' introuvable`);
	}

	saveCustomWidgets(filtered);
}

/**
 * Récupère un widget personnalisé par son ID
 */
export function getCustomWidget(widgetId: string): ExternalWidgetDefinition | undefined {
	const widgets = loadCustomWidgets();
	return widgets.find((w) => w.id === widgetId);
}

/**
 * Charge les bibliothèques de widgets depuis le localStorage
 */
export function loadWidgetLibraries(): WidgetLibraryMetadata[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY_LIBRARIES);
		if (!stored) return [];
		return JSON.parse(stored) as WidgetLibraryMetadata[];
	} catch (error) {
		logger.error("Erreur lors du chargement des bibliothèques:", error);
		return [];
	}
}

/**
 * Sauvegarde les bibliothèques de widgets dans le localStorage
 */
export function saveWidgetLibraries(libraries: WidgetLibraryMetadata[]): void {
	try {
		localStorage.setItem(STORAGE_KEY_LIBRARIES, JSON.stringify(libraries));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des bibliothèques:", error);
	}
}

/**
 * Ajoute une bibliothèque de widgets
 */
export function addWidgetLibrary(library: WidgetLibraryMetadata): void {
	const libraries = loadWidgetLibraries();
	
	// Vérifier si la bibliothèque existe déjà
	if (libraries.some((l) => l.id === library.id)) {
		throw new Error(`Une bibliothèque avec l'ID '${library.id}' existe déjà`);
	}

	// Ajouter les dates
	const libraryWithDates: WidgetLibraryMetadata = {
		...library,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	libraries.push(libraryWithDates);
	saveWidgetLibraries(libraries);
}

/**
 * Met à jour une bibliothèque de widgets
 */
export function updateWidgetLibrary(libraryId: string, updates: Partial<WidgetLibraryMetadata>): void {
	const libraries = loadWidgetLibraries();
	const index = libraries.findIndex((l) => l.id === libraryId);

	if (index === -1) {
		throw new Error(`Bibliothèque '${libraryId}' introuvable`);
	}

	libraries[index] = {
		...libraries[index],
		...updates,
		updatedAt: new Date().toISOString(),
	};

	saveWidgetLibraries(libraries);
}

/**
 * Supprime une bibliothèque de widgets
 */
export function removeWidgetLibrary(libraryId: string): void {
	const libraries = loadWidgetLibraries();
	const filtered = libraries.filter((l) => l.id !== libraryId);
	
	if (filtered.length === libraries.length) {
		throw new Error(`Bibliothèque '${libraryId}' introuvable`);
	}

	saveWidgetLibraries(filtered);
}

/**
 * Récupère une bibliothèque par son ID
 */
export function getWidgetLibrary(libraryId: string): WidgetLibraryMetadata | undefined {
	const libraries = loadWidgetLibraries();
	return libraries.find((l) => l.id === libraryId);
}


