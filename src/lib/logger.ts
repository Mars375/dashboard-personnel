/**
 * Système de logging simple avec niveaux
 * Les logs de debug sont désactivés en production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = import.meta.env.DEV;

/**
 * Logger avec niveaux de log
 */
export const logger = {
	/**
	 * Logs de debug (seulement en développement)
	 */
	debug: (...args: unknown[]) => {
		if (isDev) {
			console.log("[DEBUG]", ...args);
		}
	},

	/**
	 * Logs d'information (toujours affichés)
	 */
	info: (...args: unknown[]) => {
		console.log("[INFO]", ...args);
	},

	/**
	 * Avertissements (toujours affichés)
	 */
	warn: (...args: unknown[]) => {
		console.warn("[WARN]", ...args);
	},

	/**
	 * Erreurs (toujours affichées)
	 */
	error: (...args: unknown[]) => {
		console.error("[ERROR]", ...args);
	},

	/**
	 * Log avec un niveau spécifique
	 */
	log: (level: LogLevel, ...args: unknown[]) => {
		logger[level](...args);
	},
};

