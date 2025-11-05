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
	debug: (...args: any[]) => {
		if (isDev) {
			console.log("[DEBUG]", ...args);
		}
	},

	/**
	 * Logs d'information (toujours affichés)
	 */
	info: (...args: any[]) => {
		console.log("[INFO]", ...args);
	},

	/**
	 * Avertissements (toujours affichés)
	 */
	warn: (...args: any[]) => {
		console.warn("[WARN]", ...args);
	},

	/**
	 * Erreurs (toujours affichées)
	 */
	error: (...args: any[]) => {
		console.error("[ERROR]", ...args);
	},

	/**
	 * Log avec un niveau spécifique
	 */
	log: (level: LogLevel, ...args: any[]) => {
		logger[level](...args);
	},
};

