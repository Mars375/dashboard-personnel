import { lazy } from "react";
import type { ExternalWidgetDefinition, WidgetLibraryDefinition } from "./types";
import { loadWidget } from "./widgetLoader";
import {
	loadCustomWidgets,
	addCustomWidget,
	updateCustomWidget,
	removeCustomWidget,
	getCustomWidget,
	loadWidgetLibraries,
	addWidgetLibrary,
	removeWidgetLibrary,
} from "./widgetStorage";
import { validateWidget, validateLibrary } from "./widgetValidator";
import { widgetRegistry } from "../widgetRegistry";

/**
 * Gestionnaire de la bibliothèque de widgets
 */
class WidgetLibraryManager {
	private externalWidgets: Map<string, WidgetLibraryDefinition> = new Map();
	private loadingPromises: Map<string, Promise<void>> = new Map();

	/**
	 * Initialise la bibliothèque en chargeant les widgets personnalisés
	 */
	async initialize(): Promise<void> {
		// Charger les widgets personnalisés depuis le stockage
		const customWidgets = loadCustomWidgets();
		
		// Charger les bibliothèques et leurs widgets
		const libraries = loadWidgetLibraries();
		for (const library of libraries) {
			for (const widget of library.widgets) {
				await this.registerExternalWidget(widget, library.id);
			}
		}

		// Charger les widgets personnalisés individuels
		for (const widget of customWidgets) {
			await this.registerExternalWidget(widget);
		}
	}

	/**
	 * Enregistre un widget externe
	 */
	async registerExternalWidget(
		widget: ExternalWidgetDefinition,
		libraryId?: string
	): Promise<void> {
		// Valider le widget
		const validation = validateWidget(widget);
		if (!validation.valid) {
			const errors = validation.errors.map((e) => `${e.field}: ${e.message}`).join(", ");
			throw new Error(`Widget invalide: ${errors}`);
		}

		// Vérifier que l'ID n'est pas déjà utilisé (dans les widgets internes ou externes)
		if (widgetRegistry.some((w) => w.id === widget.id)) {
			throw new Error(`L'ID '${widget.id}' est déjà utilisé par un widget interne`);
		}

		if (this.externalWidgets.has(widget.id)) {
			throw new Error(`L'ID '${widget.id}' est déjà utilisé par un widget externe`);
		}

		// Créer la définition avec statut "loading"
		const definition: WidgetLibraryDefinition = {
			...widget,
			component: lazy(() => Promise.resolve({ default: () => null })),
			status: "loading",
			isExternal: true,
			source: libraryId || "custom",
		};

		this.externalWidgets.set(widget.id, definition);

		// Charger le widget de manière asynchrone
		const loadPromise = this.loadWidgetComponent(widget.id, widget.moduleUrl);
		this.loadingPromises.set(widget.id, loadPromise);

		await loadPromise;
	}

	/**
	 * Charge le composant d'un widget
	 */
	private async loadWidgetComponent(
		widgetId: string,
		moduleUrl: string
	): Promise<void> {
		const definition = this.externalWidgets.get(widgetId);
		if (!definition) return;

		try {
			const result = await loadWidget({
				moduleUrl,
				timeout: 30000,
			});

			if (result.success && result.component) {
				definition.component = result.component;
				definition.status = "loaded";
			} else {
				definition.status = "error";
				definition.error = result.error || "Erreur inconnue lors du chargement";
			}
		} catch (error) {
			definition.status = "error";
			definition.error = error instanceof Error ? error.message : "Erreur inconnue";
		}

		this.externalWidgets.set(widgetId, definition);
	}

	/**
	 * Récupère tous les widgets externes
	 */
	getExternalWidgets(): WidgetLibraryDefinition[] {
		return Array.from(this.externalWidgets.values());
	}

	/**
	 * Récupère un widget externe par son ID
	 */
	getExternalWidget(widgetId: string): WidgetLibraryDefinition | undefined {
		return this.externalWidgets.get(widgetId);
	}

	/**
	 * Vérifie si un widget est externe
	 */
	isExternalWidget(widgetId: string): boolean {
		return this.externalWidgets.has(widgetId);
	}

	/**
	 * Ajoute un widget personnalisé
	 */
	async addCustomWidget(widget: ExternalWidgetDefinition): Promise<void> {
		// Valider
		const validation = validateWidget(widget);
		if (!validation.valid) {
			const errors = validation.errors.map((e) => `${e.field}: ${e.message}`).join(", ");
			throw new Error(`Widget invalide: ${errors}`);
		}

		// Sauvegarder
		addCustomWidget(widget);

		// Enregistrer
		await this.registerExternalWidget(widget);
	}

	/**
	 * Met à jour un widget personnalisé
	 */
	async updateCustomWidget(widgetId: string, updates: Partial<ExternalWidgetDefinition>): Promise<void> {
		const widget = getCustomWidget(widgetId);
		if (!widget) {
			throw new Error(`Widget '${widgetId}' introuvable`);
		}

		const updated = { ...widget, ...updates };
		
		// Valider
		const validation = validateWidget(updated);
		if (!validation.valid) {
			const errors = validation.errors.map((e) => `${e.field}: ${e.message}`).join(", ");
			throw new Error(`Widget invalide: ${errors}`);
		}

		// Sauvegarder
		updateCustomWidget(widgetId, updates);

		// Recharger si le moduleUrl a changé
		if (updates.moduleUrl && updates.moduleUrl !== widget.moduleUrl) {
			this.externalWidgets.delete(widgetId);
			await this.registerExternalWidget(updated);
		} else {
			// Mettre à jour la définition
			const definition = this.externalWidgets.get(widgetId);
			if (definition) {
				Object.assign(definition, updates, {
					updatedAt: new Date().toISOString(),
				});
				this.externalWidgets.set(widgetId, definition);
			}
		}
	}

	/**
	 * Supprime un widget personnalisé
	 */
	removeCustomWidget(widgetId: string): void {
		removeCustomWidget(widgetId);
		this.externalWidgets.delete(widgetId);
		this.loadingPromises.delete(widgetId);
	}

	/**
	 * Charge une bibliothèque de widgets depuis une URL
	 */
	async loadLibraryFromUrl(url: string): Promise<void> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
			}

			const library = await response.json() as import("./types").WidgetLibraryMetadata;

			// Valider
			const validation = validateLibrary(library);
			if (!validation.valid) {
				const errors = validation.errors.map((e) => `${e.field}: ${e.message}`).join(", ");
				throw new Error(`Bibliothèque invalide: ${errors}`);
			}

			// Générer un ID si non fourni
			if (!library.id) {
				library.id = `library-${Date.now()}`;
			}

			// Sauvegarder
			addWidgetLibrary(library);

			// Enregistrer tous les widgets
			for (const widget of library.widgets) {
				await this.registerExternalWidget(widget, library.id);
			}
		} catch (error) {
			throw new Error(
				`Erreur lors du chargement de la bibliothèque: ${error instanceof Error ? error.message : "Erreur inconnue"}`
			);
		}
	}

	/**
	 * Supprime une bibliothèque
	 */
	removeLibrary(libraryId: string): void {
		const library = loadWidgetLibraries().find((l) => l.id === libraryId);
		if (!library) {
			throw new Error(`Bibliothèque '${libraryId}' introuvable`);
		}

		// Supprimer tous les widgets de cette bibliothèque
		for (const widget of library.widgets) {
			this.externalWidgets.delete(widget.id);
			this.loadingPromises.delete(widget.id);
			removeCustomWidget(widget.id);
		}

		// Supprimer la bibliothèque
		removeWidgetLibrary(libraryId);
	}

	/**
	 * Récupère tous les widgets (internes + externes)
	 */
	getAllWidgets(): Array<WidgetLibraryDefinition | { id: string; name: string; isExternal: false }> {
		const internal = widgetRegistry.map((w) => ({
			id: w.id,
			name: w.name,
			isExternal: false as const,
		}));
		const external = this.getExternalWidgets();
		return [...internal, ...external];
	}
}

// Instance singleton
export const widgetLibrary = new WidgetLibraryManager();

