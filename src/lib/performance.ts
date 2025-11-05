/**
 * Utilitaires de performance
 * Fonctions réutilisables pour optimiser les performances
 */

import { lazy as reactLazy } from "react";

/**
 * Debounce function pour limiter les appels fréquents
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}

/**
 * Throttle function pour limiter la fréquence d'exécution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function executedFunction(...args: Parameters<T>) {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

/**
 * Lazy load un composant React
 */
export function lazyLoad<T extends React.ComponentType<unknown>>(
	importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
	return reactLazy(importFn);
}

/**
 * Memoize une fonction coûteuse
 */
export function memoize<Args extends unknown[], Return>(
	fn: (...args: Args) => Return
): (...args: Args) => Return {
	const cache = new Map<string, Return>();

	return (...args: Args): Return => {
		const key = JSON.stringify(args);
		if (cache.has(key)) {
			return cache.get(key)!;
		}
		const result = fn(...args);
		cache.set(key, result);
		return result;
	};
}

/**
 * Vérifier si la virtualisation est nécessaire
 */
export function shouldVirtualize(itemCount: number): boolean {
	return itemCount > 100;
}

/**
 * Obtenir la hauteur estimée d'un élément pour la virtualisation
 * @param size Taille du widget ('compact', 'medium', 'full')
 * @returns Hauteur estimée en pixels
 */
export function getEstimatedItemHeight(size: string): number {
	switch (size) {
		case "compact":
			return 40; // Hauteur d'une tâche compacte
		case "medium":
			return 50; // Hauteur d'une tâche moyenne
		case "full":
			return 60; // Hauteur d'une tâche complète
		default:
			return 50;
	}
}

