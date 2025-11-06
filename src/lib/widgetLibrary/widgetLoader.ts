import { lazy, type LazyExoticComponent, type ComponentType } from "react";
import type { WidgetProps } from "../widgetSize";
import type { WidgetLoadConfig, WidgetLoadResult } from "./types";

/**
 * Cache des modules chargés pour éviter les rechargements
 */
const moduleCache = new Map<string, Promise<any>>();

/**
 * Charge un widget externe de manière dynamique
 */
export async function loadWidget(config: WidgetLoadConfig): Promise<WidgetLoadResult> {
	const startTime = performance.now();
	const cacheKey = `${config.moduleUrl}:${config.exportName || "default"}`;

	try {
		// Vérifier le cache
		if (moduleCache.has(cacheKey)) {
			const cachedModule = await moduleCache.get(cacheKey)!;
			const component = getComponentFromModule(cachedModule, config.exportName);
			
			return {
				success: true,
				component: lazy(() => Promise.resolve({ default: component })),
				loadTime: performance.now() - startTime,
			};
		}

		// Créer une promesse de chargement avec timeout
		const loadPromise = loadModule(config.moduleUrl, config.cache);
		moduleCache.set(cacheKey, loadPromise);

		// Appliquer le timeout si configuré
		const timeout = config.timeout || 30000; // 30s par défaut
		const module = await Promise.race([
			loadPromise,
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error(`Timeout: Le chargement du module a pris plus de ${timeout}ms`)), timeout)
			),
		]) as any;

		// Extraire le composant du module
		const component = getComponentFromModule(module, config.exportName);

		// Vérifier que c'est un composant React valide
		if (!component || typeof component !== "function") {
			throw new Error("Le module exporté n'est pas un composant React valide");
		}

		// Créer un composant lazy
		const lazyComponent = lazy(() => Promise.resolve({ default: component }));

		return {
			success: true,
			component: lazyComponent as LazyExoticComponent<ComponentType<WidgetProps>>,
			loadTime: performance.now() - startTime,
		};
	} catch (error) {
		// Retirer du cache en cas d'erreur
		moduleCache.delete(cacheKey);

		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue lors du chargement",
			loadTime: performance.now() - startTime,
		};
	}
}

/**
 * Charge un module JavaScript dynamiquement
 */
async function loadModule(url: string, cache?: WidgetLoadConfig["cache"]): Promise<any> {
	// Vérifier si c'est une URL absolue
	if (url.startsWith("http://") || url.startsWith("https://")) {
		// Charger depuis une URL externe
		return loadExternalModule(url, cache);
	}

	// Sinon, c'est un chemin relatif ou un alias
	// Utiliser import() dynamique
	return import(/* @vite-ignore */ url);
}

/**
 * Charge un module depuis une URL externe
 */
async function loadExternalModule(url: string, cache?: WidgetLoadConfig["cache"]): Promise<any> {
	// Créer un script tag pour charger le module
	// Note: Cette approche nécessite que le module soit compatible avec le système de modules du navigateur
	// ou qu'il soit transpilé pour le navigateur

	// Pour l'instant, on utilise fetch + eval (à améliorer avec un système de sandboxing)
	// ⚠️ ATTENTION: eval() est dangereux, à remplacer par un système de sandboxing sécurisé en production

	const response = await fetch(url, {
		cache: cache || "default",
	});

	if (!response.ok) {
		throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
	}

	const code = await response.text();

	// Créer un contexte isolé pour le module
	// ⚠️ Cette approche est basique et doit être améliorée avec un vrai système de sandboxing
	const moduleExports: any = {};
	const module = { exports: moduleExports };

	try {
		// Créer une fonction avec le code du module
		const moduleFunction = new Function(
			"exports",
			"module",
			"require",
			"__dirname",
			"__filename",
			code
		);

		// Exécuter le module
		moduleFunction(moduleExports, module, () => {
			throw new Error("require() n'est pas supporté dans les modules externes");
		}, "", "");

		return module.exports.default || module.exports;
	} catch (error) {
		// Si l'approche ci-dessus échoue, essayer avec import() dynamique
		// (nécessite que le serveur serve le module avec les bons headers CORS)
		try {
			const dynamicModule = await import(/* @vite-ignore */ url);
			return dynamicModule.default || dynamicModule;
		} catch (importError) {
			throw new Error(
				`Impossible de charger le module: ${error instanceof Error ? error.message : "Erreur inconnue"}`
			);
		}
	}
}

/**
 * Extrait le composant d'un module
 */
function getComponentFromModule(module: any, exportName?: string): ComponentType<WidgetProps> {
	if (!module) {
		throw new Error("Le module est vide");
	}

	// Si un nom d'export est spécifié, l'utiliser
	if (exportName) {
		if (!module[exportName]) {
			throw new Error(`L'export '${exportName}' n'existe pas dans le module`);
		}
		return module[exportName];
	}

	// Sinon, chercher default ou le premier export
	if (module.default) {
		return module.default;
	}

	// Chercher le premier export qui est une fonction
	const exports = Object.values(module);
	const component = exports.find((exp: any) => typeof exp === "function");

	if (!component) {
		throw new Error("Aucun composant React valide trouvé dans le module");
	}

	return component as ComponentType<WidgetProps>;
}

/**
 * Vide le cache des modules
 */
export function clearModuleCache(): void {
	moduleCache.clear();
}

/**
 * Retire un module du cache
 */
export function removeFromCache(url: string, exportName?: string): void {
	const cacheKey = `${url}:${exportName || "default"}`;
	moduleCache.delete(cacheKey);
}


