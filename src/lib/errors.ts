/**
 * Système d'erreurs centralisé pour la synchronisation
 * Fournit des types d'erreurs spécifiques avec codes et indicateurs de retry
 */

/**
 * Codes d'erreur pour la synchronisation
 */
export const SyncErrorCode = {
	// Erreurs d'authentification
	AUTH_REQUIRED: "AUTH_REQUIRED",
	AUTH_EXPIRED: "AUTH_EXPIRED",
	AUTH_INVALID: "AUTH_INVALID",
	
	// Erreurs réseau
	NETWORK_ERROR: "NETWORK_ERROR",
	NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
	NETWORK_UNAVAILABLE: "NETWORK_UNAVAILABLE",
	
	// Erreurs de quota/rate limiting
	RATE_LIMIT: "RATE_LIMIT",
	QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
	
	// Erreurs de validation
	VALIDATION_ERROR: "VALIDATION_ERROR",
	INVALID_DATA: "INVALID_DATA",
	
	// Erreurs de permission
	PERMISSION_DENIED: "PERMISSION_DENIED",
	FORBIDDEN: "FORBIDDEN",
	
	// Erreurs de ressource
	NOT_FOUND: "NOT_FOUND",
	RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
	
	// Erreurs serveur
	SERVER_ERROR: "SERVER_ERROR",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
	
	// Erreurs génériques
	UNKNOWN_ERROR: "UNKNOWN_ERROR",
	SYNC_FAILED: "SYNC_FAILED",
} as const;

export type SyncErrorCode = typeof SyncErrorCode[keyof typeof SyncErrorCode];

/**
 * Erreur de synchronisation avec code et indicateur de retry
 */
export class SyncError extends Error {
	public readonly code: SyncErrorCode;
	public readonly retryable: boolean;
	public readonly originalError?: unknown;

	constructor(
		message: string,
		code: SyncErrorCode,
		retryable: boolean = false,
		originalError?: unknown
	) {
		super(message);
		this.name = "SyncError";
		this.code = code;
		this.retryable = retryable;
		this.originalError = originalError;

		// Maintenir la stack trace correcte (si disponible, notamment dans Node.js)
		type ErrorWithCaptureStackTrace = {
			captureStackTrace?: (error: Error, constructor?: new (...args: unknown[]) => Error) => void;
		};
		if (typeof (Error as unknown as ErrorWithCaptureStackTrace).captureStackTrace === "function") {
			(Error as unknown as ErrorWithCaptureStackTrace).captureStackTrace?.(this, SyncError as new (...args: unknown[]) => Error);
		}
	}

	/**
	 * Crée une SyncError à partir d'une erreur inconnue
	 */
	static fromError(error: unknown): SyncError {
		if (error instanceof SyncError) {
			return error;
		}

		if (error instanceof Error) {
			const message = error.message.toLowerCase();

			// Erreurs d'authentification
			if (
				message.includes("token") ||
				message.includes("expiré") ||
				message.includes("invalid") ||
				message.includes("unauthorized") ||
				message.includes("401")
			) {
				if (message.includes("expiré") || message.includes("expired")) {
					return new SyncError(
						"Votre session a expiré. Veuillez vous reconnecter.",
						SyncErrorCode.AUTH_EXPIRED,
						false,
						error
					);
				}
				return new SyncError(
					"Authentification requise. Veuillez vous reconnecter.",
					SyncErrorCode.AUTH_REQUIRED,
					false,
					error
				);
			}

			// Erreurs réseau
			if (
				message.includes("network") ||
				message.includes("fetch") ||
				message.includes("timeout") ||
				message.includes("503") ||
				message.includes("502") ||
				message.includes("504")
			) {
				if (message.includes("timeout")) {
					return new SyncError(
						"La connexion a expiré. Veuillez réessayer.",
						SyncErrorCode.NETWORK_TIMEOUT,
						true,
						error
					);
				}
				return new SyncError(
					"Erreur réseau. Vérifiez votre connexion internet.",
					SyncErrorCode.NETWORK_ERROR,
					true,
					error
				);
			}

			// Erreurs de quota/rate limiting
			if (
				message.includes("quota") ||
				message.includes("rate limit") ||
				message.includes("429")
			) {
				return new SyncError(
					"Trop de requêtes envoyées. Veuillez patienter quelques instants.",
					SyncErrorCode.RATE_LIMIT,
					true,
					error
				);
			}

			// Erreurs de validation
			if (
				message.includes("invalid") ||
				message.includes("validation") ||
				message.includes("400")
			) {
				return new SyncError(
					"Les données envoyées sont invalides.",
					SyncErrorCode.VALIDATION_ERROR,
					false,
					error
				);
			}

			// Erreurs de permission
			if (
				message.includes("permission") ||
				message.includes("forbidden") ||
				message.includes("403")
			) {
				return new SyncError(
					"Permission refusée. Vérifiez vos autorisations.",
					SyncErrorCode.PERMISSION_DENIED,
					false,
					error
				);
			}

			// Erreurs de ressource
			if (message.includes("not found") || message.includes("404")) {
				return new SyncError(
					"Ressource introuvable.",
					SyncErrorCode.NOT_FOUND,
					false,
					error
				);
			}

			// Erreurs serveur
			if (
				message.includes("server") ||
				message.includes("500") ||
				message.includes("502") ||
				message.includes("503")
			) {
				return new SyncError(
					"Erreur serveur. Veuillez réessayer plus tard.",
					SyncErrorCode.SERVER_ERROR,
					true,
					error
				);
			}

			// Erreur générique avec message personnalisé
			return new SyncError(
				error.message || "Une erreur inattendue s'est produite.",
				SyncErrorCode.UNKNOWN_ERROR,
				true,
				error
			);
		}

		// Erreur complètement inconnue
		return new SyncError(
			"Une erreur inattendue s'est produite lors de la synchronisation.",
			SyncErrorCode.UNKNOWN_ERROR,
			true,
			error
		);
	}

	/**
	 * Vérifie si une erreur est retryable
	 */
	static isRetryable(error: unknown): boolean {
		if (error instanceof SyncError) {
			return error.retryable;
		}
		const syncError = SyncError.fromError(error);
		return syncError.retryable;
	}

	/**
	 * Vérifie si une erreur est liée à l'authentification
	 */
	static isAuthError(error: unknown): boolean {
		if (error instanceof SyncError) {
			return (
				error.code === SyncErrorCode.AUTH_REQUIRED ||
				error.code === SyncErrorCode.AUTH_EXPIRED ||
				error.code === SyncErrorCode.AUTH_INVALID
			);
		}
		const syncError = SyncError.fromError(error);
		return (
			syncError.code === SyncErrorCode.AUTH_REQUIRED ||
			syncError.code === SyncErrorCode.AUTH_EXPIRED ||
			syncError.code === SyncErrorCode.AUTH_INVALID
		);
	}

	/**
	 * Vérifie si une erreur est liée au réseau
	 */
	static isNetworkError(error: unknown): boolean {
		if (error instanceof SyncError) {
			return (
				error.code === SyncErrorCode.NETWORK_ERROR ||
				error.code === SyncErrorCode.NETWORK_TIMEOUT ||
				error.code === SyncErrorCode.NETWORK_UNAVAILABLE
			);
		}
		const syncError = SyncError.fromError(error);
		return (
			syncError.code === SyncErrorCode.NETWORK_ERROR ||
			syncError.code === SyncErrorCode.NETWORK_TIMEOUT ||
			syncError.code === SyncErrorCode.NETWORK_UNAVAILABLE
		);
	}
}

