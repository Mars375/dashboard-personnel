// Provider de synchronisation Google Tasks avec OAuth

import type { Todo } from "@/store/todoStorage";
import type { SyncProvider, SyncResult, SyncConfig } from "./apiSync";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { logger } from "@/lib/logger";
import { SyncError, SyncErrorCode } from "@/lib/errors";
import type { GoogleTaskList } from "./googleTasksValidation";
import {
	groupTasksByOperation,
	executeCreateBatch,
	executeUpdateBatch,
	type TaskOperationGroup,
	type TaskOperationResult,
} from "./googleTasksBatch";
import {
	getAllTaskLists,
	getTasks,
	testTaskList,
	createTaskList,
	createTask,
	updateTask,
	deleteTask,
} from "./googleTasksApi";
import {
	convertFromGoogleTask,
	convertToGoogleTask,
} from "./googleTasksMapper";

// Types Google Tasks API sont maintenant définis dans googleTasksValidation.ts

export class GoogleTasksSyncProvider implements SyncProvider {
	name = "Google Tasks";
	enabled: boolean;
	private taskListId: string | null = null; // ID de la liste de tâches par défaut (pour compatibilité)
	private readonly STORAGE_KEY = "googleTasks_taskListId"; // Clé pour persister le taskListId par défaut
	private readonly LIST_MAPPING_KEY = "googleTasks_listMapping"; // Clé pour mapper listes locales -> Google Tasks
	private readonly MAX_RETRIES = 3; // Nombre maximum de tentatives en cas d'erreur
	private readonly RETRY_DELAY = 1000; // Délai entre les tentatives (ms)

	constructor(config: SyncConfig) {
		this.enabled = config.enabled;
		// Charger le taskListId depuis localStorage si disponible
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				this.taskListId = stored;
				logger.debug(
					`📦 taskListId chargé depuis localStorage: ${this.taskListId}`
				);
			}
		} catch (error) {
			logger.warn(
				"Impossible de charger taskListId depuis localStorage:",
				error
			);
		}
	}

	/**
	 * Fonction utilitaire pour retry automatique en cas d'erreur réseau
	 */
	private async retryWithBackoff<T>(
		fn: () => Promise<T>,
		retries = this.MAX_RETRIES
	): Promise<T> {
		try {
			return await fn();
		} catch (error) {
			// Convertir l'erreur en SyncError si nécessaire
			const syncError = SyncError.fromError(error);

			if (retries > 0 && syncError.retryable) {
				logger.debug(
					`🔄 Tentative de retry (${this.MAX_RETRIES - retries + 1}/${
						this.MAX_RETRIES
					})...`
				);
				await new Promise((resolve) =>
					setTimeout(
						resolve,
						this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1)
					)
				);
				return this.retryWithBackoff(fn, retries - 1);
			}
			throw syncError;
		}
	}

	/**
	 * Sauvegarde le taskListId dans localStorage
	 */
	private saveTaskListId(taskListId: string): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, taskListId);
			this.taskListId = taskListId;
			logger.debug(`💾 taskListId sauvegardé dans localStorage: ${taskListId}`);
		} catch (error) {
			logger.warn(
				"Impossible de sauvegarder taskListId dans localStorage:",
				error
			);
			// Sauvegarder quand même en mémoire
			this.taskListId = taskListId;
		}
	}

	/**
	 * Récupère un token d'accès valide avec retry
	 */
	private async getAccessToken(): Promise<string> {
		return this.retryWithBackoff(async () => {
			const manager = getOAuthManager();
			if (!manager.isConnected("google")) {
				throw new Error(
					"Non connecté à Google. Veuillez vous connecter d'abord."
				);
			}
			return await manager.getValidAccessToken("google");
		});
	}

	/**
	 * Récupère toutes les listes de tâches disponibles
	 */
	async getAllTaskLists(): Promise<GoogleTaskList[]> {
		const accessToken = await this.getAccessToken();
		return getAllTaskLists({
			accessToken,
			retryWithBackoff: this.retryWithBackoff.bind(this),
		});
	}

	/**
	 * Récupère la liste de tâches par défaut "@default" de Google Tasks
	 * La liste "@default" existe toujours dans Google Tasks et correspond à "Mes Tâches"
	 */
	async getOrCreateDefaultTaskList(): Promise<string> {
		// Vérifier si le taskListId enregistré existe encore
		if (this.taskListId) {
			logger.debug(
				`✅ Tentative de réutilisation de la liste (ID: ${this.taskListId})`
			);
			// Tester si la liste existe encore
			try {
				const accessToken = await this.getAccessToken();
				const isValid = await testTaskList(this.taskListId, {
					accessToken,
				});

				if (isValid) {
					logger.debug(`✅ Liste (ID: ${this.taskListId}) toujours valide`);
					return this.taskListId;
				} else {
					logger.warn(
						`⚠️ Liste sauvegardée (ID: ${this.taskListId}) n'existe plus, réinitialisation...`
					);
					// La liste n'existe plus, réinitialiser taskListId
					this.taskListId = null;
					localStorage.removeItem(this.STORAGE_KEY);
				}
			} catch (error) {
				logger.warn(
					`⚠️ Erreur lors de la vérification de la liste, réinitialisation...`,
					error
				);
				this.taskListId = null;
				localStorage.removeItem(this.STORAGE_KEY);
			}
		}

		try {
			const accessToken = await this.getAccessToken();

			// D'abord, récupérer toutes les listes existantes pour éviter les doublons
			const taskLists = await this.getAllTaskLists();
			logger.debug(
				`📋 ${taskLists.length} liste(s) trouvée(s):`,
				taskLists.map((l) => l.title)
			);

			// 1. Chercher une liste "Dashboard Personnel" existante pour éviter les doublons
			let defaultList = taskLists.find(
				(list) => list.title === "Dashboard Personnel"
			);

			if (defaultList) {
				logger.debug(
					`✅ Liste "Dashboard Personnel" existante trouvée (ID: ${defaultList.id})`
				);
				this.saveTaskListId(defaultList.id);
				return this.taskListId!;
			}

			// 2. Chercher "My Tasks" ou "Mes Tâches" dans les listes existantes
			defaultList = taskLists.find(
				(list) =>
					list.title === "My Tasks" ||
					list.title === "Mes Tâches" ||
					list.title === "Ma liste"
			);

			if (defaultList) {
				logger.debug(
					`✅ Liste "${defaultList.title}" trouvée (ID: ${defaultList.id})`
				);
				this.saveTaskListId(defaultList.id);
				return this.taskListId!;
			}

			// 3. La liste "@default" existe toujours dans Google Tasks et correspond à "Mes Tâches"
			// Elle peut ne pas apparaître dans getAllTaskLists(), mais on peut toujours y accéder directement
			// Testons si on peut accéder à @default
			try {
				const isValid = await testTaskList("@default", {
					accessToken,
				});

				if (isValid) {
					logger.debug("✅ Utilisation de la liste @default (Mes Tâches)");
					this.saveTaskListId("@default");
					return this.taskListId!;
				} else {
					logger.warn("⚠️ @default non accessible");
				}
			} catch (testError) {
				logger.warn("⚠️ Erreur lors du test de @default:", testError);
			}

			// 4. Dernier recours : créer une nouvelle liste seulement si vraiment nécessaire
			// MAIS on vérifie d'abord qu'on n'a pas déjà une liste "Dashboard Personnel" créée récemment
			logger.warn(
				"⚠️ Aucune liste par défaut trouvée, vérification finale avant création..."
			);

			// Attendre un peu et re-vérifier les listes (au cas où une autre instance aurait créé une liste)
			await new Promise((resolve) => setTimeout(resolve, 500));
			const taskListsRecheck = await this.getAllTaskLists();
			const existingDashboardList = taskListsRecheck.find(
				(list) => list.title === "Dashboard Personnel"
			);

			if (existingDashboardList) {
				logger.debug(
					`✅ Liste "Dashboard Personnel" trouvée lors de la re-vérification (ID: ${existingDashboardList.id})`
				);
				this.saveTaskListId(existingDashboardList.id);
				return this.taskListId!;
			}

			// Créer une nouvelle liste seulement si vraiment aucune autre option ne fonctionne
			logger.warn("⚠️ Création d'une nouvelle liste 'Dashboard Personnel'...");
			const newList = await createTaskList("Dashboard Personnel", {
				accessToken,
			});
			logger.debug(
				`✅ Nouvelle liste créée: "${newList.title}" (ID: ${newList.id})`
			);
			this.saveTaskListId(newList.id);
			return newList.id;
		} catch (error) {
			logger.error(
				"Erreur lors de la récupération/création de la liste:",
				error
			);
			throw error;
		}
	}


	/**
	 * Obtient ou crée une liste Google Tasks correspondant à une liste locale
	 * @param localListName Nom de la liste locale (ex: "Pro", "Perso", "Projets")
	 * @returns ID de la liste Google Tasks
	 */
	async getOrCreateTaskList(localListName: string): Promise<string> {
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		// Charger le mapping des listes
		const listMapping = this.loadListMapping();

		// Vérifier si on a déjà un mapping pour cette liste
		if (listMapping[localListName]) {
			const googleListId = listMapping[localListName];
				// Vérifier si la liste existe encore
			try {
				const accessToken = await this.getAccessToken();
				const isValid = await testTaskList(googleListId, {
					accessToken,
				});

				if (isValid) {
					logger.debug(
						`✅ Liste Google Tasks "${localListName}" trouvée (ID: ${googleListId})`
					);
					return googleListId;
				} else {
					logger.warn(
						`⚠️ Liste Google Tasks "${localListName}" n'existe plus, recréation...`
					);
					// La liste n'existe plus, on va la recréer
					delete listMapping[localListName];
					this.saveListMapping(listMapping);
				}
			} catch (error) {
				logger.warn(
					`⚠️ Erreur lors de la vérification de la liste "${localListName}", recréation...`,
					error
				);
				delete listMapping[localListName];
				this.saveListMapping(listMapping);
			}
		}

		// La liste n'existe pas ou n'est plus valide, chercher ou créer
		try {
			const accessToken = await this.getAccessToken();
			const allLists = await this.getAllTaskLists();

			// Chercher une liste existante avec le même nom
			const existingList = allLists.find(
				(list) => list.title === localListName
			);

			if (existingList) {
				logger.debug(
					`✅ Liste Google Tasks "${localListName}" existante trouvée (ID: ${existingList.id})`
				);
				// Sauvegarder le mapping
				listMapping[localListName] = existingList.id;
				this.saveListMapping(listMapping);
				return existingList.id;
			}

			// Créer une nouvelle liste
			logger.debug(
				`📝 Création d'une nouvelle liste Google Tasks: "${localListName}"`
			);
			const newList = await createTaskList(localListName, {
				accessToken,
			});
			logger.debug(
				`✅ Nouvelle liste Google Tasks créée: "${newList.title}" (ID: ${newList.id})`
			);

			// Sauvegarder le mapping
			listMapping[localListName] = newList.id;
			this.saveListMapping(listMapping);

			return newList.id;
		} catch (error) {
			logger.error(
				`Erreur lors de la récupération/création de la liste "${localListName}":`,
				error
			);
			throw error;
		}
	}

	/**
	 * Charge le mapping des listes locales vers Google Tasks
	 */
	private loadListMapping(): Record<string, string> {
		try {
			const stored = localStorage.getItem(this.LIST_MAPPING_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch {
			// Ignore errors
		}
		return {};
	}

	/**
	 * Sauvegarde le mapping des listes locales vers Google Tasks
	 */
	private saveListMapping(mapping: Record<string, string>): void {
		try {
			localStorage.setItem(this.LIST_MAPPING_KEY, JSON.stringify(mapping));
		} catch {
			// Ignore errors
		}
	}

	/**
	 * Récupère toutes les listes Google Tasks et retourne celles qui n'ont pas de correspondance locale
	 * @param localListNames Noms des listes locales existantes
	 * @returns Liste des noms de listes Google Tasks qui n'existent pas localement
	 */
	async getMissingLocalLists(
		localListNames: string[]
	): Promise<GoogleTaskList[]> {
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		try {
			const allGoogleLists = await this.getAllTaskLists();
			const localListNamesSet = new Set(localListNames);

			// Filtrer les listes Google Tasks qui n'ont pas de correspondance locale
			// Ignorer la liste "@default" car elle est gérée séparément
			const missingLists = allGoogleLists.filter((googleList) => {
				// Ignorer @default qui est géré par getOrCreateDefaultTaskList
				if (googleList.id === "@default") {
					// Pour @default, on utilise le titre "Mes Tâches" ou similaire
					const defaultListName = googleList.title || "Mes Tâches";
					return !localListNamesSet.has(defaultListName);
				}
				return !localListNamesSet.has(googleList.title);
			});

			return missingLists;
		} catch (error) {
			logger.error(
				"Erreur lors de la récupération des listes manquantes:",
				error
			);
			throw error;
		}
	}

	/**
	 * Synchronise les tâches (pull depuis Google Tasks)
	 * @param localListName Nom de la liste locale pour laquelle récupérer les tâches
	 */
	async pullTodos(localListName?: string): Promise<Todo[]> {
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		// Si une liste locale est spécifiée, utiliser la liste Google Tasks correspondante
		// Sinon, utiliser la liste par défaut (pour compatibilité)
		const taskListId = localListName
			? await this.getOrCreateTaskList(localListName)
			: await this.getOrCreateDefaultTaskList();

		logger.debug(
			`📋 Utilisation de la liste Google Tasks "${
				localListName || "default"
			}" (ID: ${taskListId})`
		);
		const accessToken = await this.getAccessToken();

		try {
			const googleTasks = await getTasks(taskListId, {
				accessToken,
				retryWithBackoff: this.retryWithBackoff.bind(this),
			});

			const todos: Todo[] = googleTasks
				.filter((task) => !task.deleted && !task.hidden)
				.map((googleTask) => {
					const localTodo = convertFromGoogleTask(googleTask);
					// Préfixer l'ID avec "google-" pour identifier l'origine
					if (googleTask.id) {
						localTodo.id = `google-${googleTask.id}`;
					}
					return localTodo;
				});

			logger.debug(
				`✅ ${todos.length} tâche(s) récupérée(s) depuis Google Tasks`
			);
			return todos;
		} catch (error) {
			const syncError = SyncError.fromError(error);
			if (syncError.code === SyncErrorCode.NOT_FOUND) {
				// La liste n'existe plus, réinitialiser taskListId
				this.taskListId = null;
				localStorage.removeItem(this.STORAGE_KEY);
				// Réessayer avec une nouvelle liste
				const newTaskListId = await this.getOrCreateDefaultTaskList();
				logger.debug(
					`🔄 Nouvelle liste obtenue (ID: ${newTaskListId}), réessai...`
				);
				return await this.pullTodos(localListName);
			}
			logger.error("Erreur lors de la récupération des tâches:", error);
			throw error;
		}
	}

	/**
	 * Pousse les tâches vers Google Tasks
	 * @param todos Tâches à synchroniser
	 * @param localListName Nom de la liste locale pour laquelle synchroniser les tâches
	 * @returns Map des IDs locaux vers les IDs Google créés (pour les nouvelles tâches)
	 */
	async pushTodos(
		todos: Todo[],
		localListName?: string
	): Promise<Map<string, string>> {
		const idMap = new Map<string, string>();
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		// Si une liste locale est spécifiée, utiliser la liste Google Tasks correspondante
		// Sinon, utiliser la liste par défaut (pour compatibilité)
		const taskListId = localListName
			? await this.getOrCreateTaskList(localListName)
			: await this.getOrCreateDefaultTaskList();

		logger.debug(
			`📋 Utilisation de la liste Google Tasks "${
				localListName || "default"
			}" (ID: ${taskListId})`
		);
		const accessToken = await this.getAccessToken();

		// Grouper les tâches par type d'opération (création vs mise à jour)
		const { creates, updates } = groupTasksByOperation(todos, (todo) =>
			convertToGoogleTask(todo)
		);

		logger.debug(
			`📦 Groupe des tâches: ${creates.length} création(s), ${updates.length} mise(s) à jour`
		);

		// Exécuter les créations en parallèle par batches
		const createResults = await executeCreateBatch(
			creates,
			taskListId,
			accessToken,
			async (task, taskListId, accessToken) => {
				return await this.executeCreateTask(task, taskListId, accessToken);
			}
		);

		// Exécuter les mises à jour en parallèle par batches
		const updateResults = await executeUpdateBatch(
			updates,
			taskListId,
			accessToken,
			async (task, taskListId, accessToken) => {
				return await this.executeUpdateTask(task, taskListId, accessToken);
			}
		);

		// Construire la map d'IDs à partir des résultats
		// Seulement pour les nouvelles tâches créées (pas les mises à jour)
		for (const result of createResults) {
			if (result.success && result.googleId) {
				idMap.set(result.todoId, result.googleId);
			} else if (!result.success) {
				logger.error(
					`❌ Erreur lors de la création de la tâche ${result.todoId}: ${result.error}`
				);
			}
		}

		// Pour les mises à jour, on ne retourne pas d'ID dans la map (elles ont déjà un ID Google)
		for (const result of updateResults) {
			if (!result.success) {
				logger.error(
					`❌ Erreur lors de la mise à jour de la tâche ${result.todoId}: ${result.error}`
				);
			}
		}

		return idMap;
	}

	/**
	 * Exécute la création d'une tâche
	 */
	private async executeCreateTask(
		task: TaskOperationGroup,
		taskListId: string,
		accessToken: string
	): Promise<TaskOperationResult> {
		try {
			const finalPayload = JSON.parse(JSON.stringify(task.taskToSend));
			// Vérification finale : s'assurer qu'on n'envoie pas status si undefined ou needsAction
			if (
				finalPayload.status === "needsAction" ||
				finalPayload.status === undefined
			) {
				delete finalPayload.status;
			}

			// Envelopper l'appel à createTask avec retryWithBackoff pour gérer les erreurs réseau
			const createdTask = await this.retryWithBackoff(async () => {
				return await createTask(
					taskListId,
					finalPayload,
					{
						accessToken,
					}
				);
			});

			if (!createdTask || !createdTask.id) {
				throw new SyncError(
					"La tâche créée n'a pas un format valide",
					SyncErrorCode.VALIDATION_ERROR,
					false
				);
			}

			return {
				todoId: task.todo.id,
				success: true,
				googleId: `google-${createdTask.id}`,
			};
		} catch (error) {
			const syncError = SyncError.fromError(error);
			return {
				todoId: task.todo.id,
				success: false,
				error: syncError.message,
			};
		}
	}

	/**
	 * Exécute la mise à jour d'une tâche
	 */
	private async executeUpdateTask(
		task: TaskOperationGroup,
		taskListId: string,
		accessToken: string
	): Promise<TaskOperationResult> {
		try {
			if (!task.googleTaskId) {
				throw new SyncError(
					"ID Google manquant pour la mise à jour",
					SyncErrorCode.VALIDATION_ERROR,
					false
				);
			}

			try {
				await updateTask(
					taskListId,
					task.googleTaskId,
					task.taskToSend,
					{
						accessToken,
						retryWithBackoff: this.retryWithBackoff.bind(this),
					}
				);

				return {
					todoId: task.todo.id,
					success: true,
					googleId: task.todo.id, // L'ID reste le même pour les mises à jour
				};
			} catch (error) {
				const syncError = SyncError.fromError(error);
				if (syncError.code === SyncErrorCode.NOT_FOUND) {
					return {
						todoId: task.todo.id,
						success: false,
						error: "Tâche non trouvée",
					};
				}
				throw error;
			}
		} catch (error) {
			const syncError = SyncError.fromError(error);
			return {
				todoId: task.todo.id,
				success: false,
				error: syncError.message,
			};
		}
	}

	/**
	 * Supprime une tâche de Google Tasks
	 */
	async deleteTask(taskId: string, listId?: string): Promise<void> {
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		try {
			const taskListId = listId || (await this.getOrCreateDefaultTaskList());
			const accessToken = await this.getAccessToken();

			// Extraire l'ID Google si c'est un ID préfixé
			const googleTaskId = taskId.startsWith("google-")
				? taskId.replace("google-", "")
				: taskId;

			try {
				await deleteTask(googleTaskId, taskListId, {
					accessToken,
					retryWithBackoff: this.retryWithBackoff.bind(this),
				});
			} catch (error) {
				const syncError = SyncError.fromError(error);
				if (syncError.code === SyncErrorCode.NOT_FOUND) {
					// La tâche n'existe plus, c'est OK
					logger.debug("Tâche déjà supprimée sur Google Tasks");
					return;
				}
				logger.error(
					`❌ Erreur lors de la suppression de la tâche Google Tasks:`,
					error
				);
				throw error;
			}
		} catch (error) {
			// Si c'est une erreur d'authentification (token invalide), on la propage avec un message clair
			if (error instanceof Error && error.message.includes("Token invalide")) {
				throw error;
			}
			// Pour les autres erreurs (réseau, etc.), on log mais on ne bloque pas la suppression locale
			logger.error(
				"⚠️ Erreur lors de la suppression de la tâche Google Tasks (suppression locale effectuée):",
				error
			);
			throw error;
		}
	}

	/**
	 * Synchronise toutes les tâches (pull + push)
	 */
	async sync(): Promise<SyncResult> {
		if (!this.enabled) {
			return {
				success: false,
				message: "Google Tasks sync is disabled",
				error: "Sync désactivé",
			};
		}

		try {
			// Pour l'instant, on fait juste un pull
			// Le push sera géré individuellement lors des modifications
			const pulledTodos = await this.pullTodos();

			return {
				success: true,
				message: `Synchronisation réussie: ${pulledTodos.length} tâche(s) récupérée(s)`,
				todosPulled: pulledTodos.length,
			};
		} catch (error) {
			return {
				success: false,
				message: "Erreur lors de la synchronisation Google Tasks",
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}
