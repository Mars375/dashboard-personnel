/**
 * Constantes partagées dans l'application
 * Centralise les valeurs réutilisables pour améliorer la maintenabilité
 */

// Durées de synchronisation (en millisecondes)
export const SYNC_INTERVALS = {
	GOOGLE_TASKS: 5 * 60 * 1000, // 5 minutes
	GOOGLE_CALENDAR: 5 * 60 * 1000, // 5 minutes
	INITIAL_DELAY: 2000, // 2 secondes
} as const;

// Délais de retry (en millisecondes)
export const RETRY_DELAYS = {
	INITIAL: 1000, // 1 seconde
	MAX: 10000, // 10 secondes
	MULTIPLIER: 2,
} as const;

// Tailles de widgets
export const WIDGET_SIZES = {
	COMPACT: "compact",
	MEDIUM: "medium",
	FULL: "full",
} as const;

export type WidgetSize = (typeof WIDGET_SIZES)[keyof typeof WIDGET_SIZES];

// Filtres de tâches
export const TODO_FILTERS = {
	ALL: "all",
	ACTIVE: "active",
	COMPLETED: "completed",
	PRIORITY: "priority",
} as const;

export type TodoFilter = (typeof TODO_FILTERS)[keyof typeof TODO_FILTERS];

// Limites de performance
export const PERFORMANCE_LIMITS = {
	MAX_TODOS_WITHOUT_VIRTUALIZATION: 100,
	MAX_ITEMS_PER_PAGE: 50,
	DEBOUNCE_DELAY: 300, // millisecondes
} as const;

// Messages d'erreur génériques
export const ERROR_MESSAGES = {
	GENERIC: "Une erreur est survenue",
	NETWORK: "Erreur de connexion réseau",
	UNAUTHORIZED: "Non autorisé",
	NOT_FOUND: "Ressource non trouvée",
	SYNC_FAILED: "La synchronisation a échoué",
} as const;

