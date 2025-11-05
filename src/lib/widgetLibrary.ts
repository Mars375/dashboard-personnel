/**
 * Widget Library System - Système de base pour ajout dynamique de widgets
 */

export interface WidgetManifest {
	id: string;
	name: string;
	description: string;
	version: string;
	author?: string;
	icon?: string;
	componentUrl?: string;
	category?: string;
	tags?: string[];
}

const STORAGE_KEY = "widgetLibrary:installed";

export function loadInstalledWidgets(): WidgetManifest[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error("Erreur lors du chargement des widgets installés:", error);
	}
	return [];
}

export function saveInstalledWidgets(widgets: WidgetManifest[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
	} catch (error) {
		console.error("Erreur lors de la sauvegarde des widgets installés:", error);
	}
}

export function installWidget(manifest: WidgetManifest): void {
	const installed = loadInstalledWidgets();
	if (!installed.find((w) => w.id === manifest.id)) {
		installed.push(manifest);
		saveInstalledWidgets(installed);
	}
}

export function uninstallWidget(widgetId: string): void {
	const installed = loadInstalledWidgets();
	const filtered = installed.filter((w) => w.id !== widgetId);
	saveInstalledWidgets(filtered);
}

export function isWidgetInstalled(widgetId: string): boolean {
	const installed = loadInstalledWidgets();
	return installed.some((w) => w.id === widgetId);
}

