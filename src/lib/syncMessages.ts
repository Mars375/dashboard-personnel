/**
 * Messages centralisés pour la synchronisation Google Tasks
 * Améliore la cohérence et la maintenabilité des messages utilisateur
 */

export interface SyncMessage {
	title: string;
	description?: string;
}

/**
 * Messages de succès pour les opérations de synchronisation
 */
export const syncMessages = {
	// Création de tâche
	taskCreated: (taskTitle: string, listName?: string): SyncMessage => ({
		title: "Tâche synchronisée",
		description: `"${taskTitle}" a été créée dans Google Tasks${
			listName ? ` (liste: ${listName})` : ""
		}`,
	}),

	// Mise à jour de tâche
	taskUpdated: (taskTitle: string, listName?: string): SyncMessage => ({
		title: "Tâche mise à jour",
		description: `"${taskTitle}" a été mise à jour dans Google Tasks${
			listName ? ` (liste: ${listName})` : ""
		}`,
	}),

	// Tâche complétée/réactivée
	taskCompleted: (
		taskTitle: string,
		completed: boolean,
		listName?: string
	): SyncMessage => ({
		title: "Tâche synchronisée",
		description: `"${taskTitle}" a été ${
			completed ? "complétée" : "réactivée"
		} dans Google Tasks${listName ? ` (liste: ${listName})` : ""}`,
	}),

	// Suppression de tâche
	taskDeleted: (taskTitle: string, listName?: string): SyncMessage => ({
		title: "Tâche supprimée",
		description: `"${taskTitle}" a été supprimée de Google Tasks${
			listName ? ` (liste: ${listName})` : ""
		}`,
	}),

	// Synchronisation multiple
	tasksSynced: (count: number, listName?: string): SyncMessage => ({
		title: "Synchronisation réussie",
		description: `${count} tâche(s) synchronisée(s) avec Google Tasks${
			listName ? ` (liste: ${listName})` : ""
		}`,
	}),

	// Synchronisation générale
	syncCompleted: (listsCount?: number): SyncMessage => ({
		title: "Synchronisation terminée",
		description: listsCount
			? `Synchronisation terminée pour ${listsCount} liste(s)`
			: "Synchronisation terminée avec succès",
	}),
};

/**
 * Messages d'erreur pour les opérations de synchronisation
 */
export interface SyncError {
	title: string;
	description: string;
	retryable: boolean;
}

/**
 * Catégorise et formate les erreurs de synchronisation
 */
export function getSyncError(error: unknown): SyncError {
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
			return {
				title: "Authentification requise",
				description:
					"Votre session a expiré. Veuillez vous reconnecter à Google Tasks.",
				retryable: false,
			};
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
			return {
				title: "Erreur réseau",
				description:
					"Impossible de se connecter à Google Tasks. Vérifiez votre connexion internet.",
				retryable: true,
			};
		}

		// Erreurs de quota/rate limiting
		if (
			message.includes("quota") ||
			message.includes("rate limit") ||
			message.includes("429")
		) {
			return {
				title: "Limite atteinte",
				description:
					"Trop de requêtes envoyées. Veuillez patienter quelques instants avant de réessayer.",
				retryable: true,
			};
		}

		// Erreurs de validation
		if (
			message.includes("invalid") ||
			message.includes("validation") ||
			message.includes("400")
		) {
			return {
				title: "Données invalides",
				description:
					"Les données envoyées sont invalides. Veuillez réessayer.",
				retryable: false,
			};
		}

		// Erreurs de permission
		if (
			message.includes("permission") ||
			message.includes("forbidden") ||
			message.includes("403")
		) {
			return {
				title: "Permission refusée",
				description:
					"Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
				retryable: false,
			};
		}

		// Erreur générique avec message personnalisé
		return {
			title: "Erreur de synchronisation",
			description: error.message || "Une erreur inattendue s'est produite.",
			retryable: true,
		};
	}

	// Erreur inconnue
	return {
		title: "Erreur inattendue",
		description:
			"Une erreur inattendue s'est produite lors de la synchronisation.",
		retryable: true,
	};
}

/**
 * Messages d'avertissement pour les opérations de synchronisation
 */
export const syncWarnings = {
	// Suppression locale uniquement
	taskDeletedLocally: (
		reason?: string
	): { title: string; description: string } => ({
		title: "Tâche supprimée localement",
		description:
			reason ||
			"La suppression sur Google Tasks a échoué. La tâche a été supprimée uniquement de l'application locale.",
	}),

	// Aucun ID retourné
	noGoogleIdReturned: (taskTitle: string): { title: string; description: string } => ({
		title: "Synchronisation partielle",
		description: `La tâche "${taskTitle}" a été créée localement, mais aucun ID Google n'a été retourné. Elle sera synchronisée lors de la prochaine synchronisation.`,
	}),

	// Tâche non trouvée
	taskNotFound: (taskTitle: string): { title: string; description: string } => ({
		title: "Tâche non trouvée",
		description: `La tâche "${taskTitle}" n'a pas été trouvée. Synchronisation de toutes les tâches locales...`,
	}),
};

