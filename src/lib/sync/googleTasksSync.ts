// Provider de synchronisation Google Tasks avec OAuth

import type { Todo } from "@/store/todoStorage";
import type { SyncProvider, SyncResult, SyncConfig } from "./apiSync";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { format, parseISO } from "date-fns";

// Types Google Tasks API
interface GoogleTask {
	id?: string;
	title?: string;
	notes?: string;
	status?: "needsAction" | "completed";
	due?: string; // RFC 3339 format (YYYY-MM-DDTHH:mm:ss.sssZ) ou date seule (YYYY-MM-DD)
	completed?: string; // RFC 3339 format
	updated?: string; // RFC 3339 format
	position?: string; // Position dans la liste
	parent?: string; // ID de la tâche parente (pour sous-tâches)
	deleted?: boolean;
	hidden?: boolean;
}

interface GoogleTaskList {
	id: string;
	title: string;
	updated?: string;
}

interface GoogleTasksListResponse {
	items: GoogleTaskList[];
	nextPageToken?: string;
}

interface GoogleTasksResponse {
	items: GoogleTask[];
	nextPageToken?: string;
}

export class GoogleTasksSyncProvider implements SyncProvider {
	name = "Google Tasks";
	enabled: boolean;
	private config: SyncConfig;
	private taskListId: string | null = null; // ID de la liste de tâches par défaut
	private readonly STORAGE_KEY = "googleTasks_taskListId"; // Clé pour persister le taskListId

	constructor(config: SyncConfig) {
		this.config = config;
		this.enabled = config.enabled;
		// Charger le taskListId depuis localStorage si disponible
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				this.taskListId = stored;
				console.log(
					`📦 taskListId chargé depuis localStorage: ${this.taskListId}`
				);
			}
		} catch (error) {
			console.warn(
				"Impossible de charger taskListId depuis localStorage:",
				error
			);
		}
	}

	/**
	 * Sauvegarde le taskListId dans localStorage
	 */
	private saveTaskListId(taskListId: string): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, taskListId);
			this.taskListId = taskListId;
			console.log(`💾 taskListId sauvegardé dans localStorage: ${taskListId}`);
		} catch (error) {
			console.warn(
				"Impossible de sauvegarder taskListId dans localStorage:",
				error
			);
			// Sauvegarder quand même en mémoire
			this.taskListId = taskListId;
		}
	}

	/**
	 * Récupère un token d'accès valide
	 */
	private async getAccessToken(): Promise<string> {
		const manager = getOAuthManager();
		if (!manager.isConnected("google")) {
			throw new Error(
				"Non connecté à Google. Veuillez vous connecter d'abord."
			);
		}
		return await manager.getValidAccessToken("google");
	}

	/**
	 * Récupère toutes les listes de tâches disponibles
	 */
	async getAllTaskLists(): Promise<GoogleTaskList[]> {
		try {
			const accessToken = await this.getAccessToken();
			const taskLists: GoogleTaskList[] = [];
			let pageToken: string | undefined;

			do {
				const params = new URLSearchParams();
				if (pageToken) {
					params.append("pageToken", pageToken);
				}

				const response = await fetch(
					`https://www.googleapis.com/tasks/v1/users/@me/lists?${params.toString()}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error(
						`Erreur lors de la récupération des listes: ${response.statusText}`
					);
				}

				const data = (await response.json()) as GoogleTasksListResponse;
				taskLists.push(...data.items);
				pageToken = data.nextPageToken;
			} while (pageToken);

			return taskLists;
		} catch (error) {
			console.error(
				"Erreur lors de la récupération des listes de tâches:",
				error
			);
			throw error;
		}
	}

	/**
	 * Récupère la liste de tâches par défaut "@default" de Google Tasks
	 * La liste "@default" existe toujours dans Google Tasks et correspond à "Mes Tâches"
	 */
	async getOrCreateDefaultTaskList(): Promise<string> {
		// Vérifier si le taskListId enregistré existe encore
		if (this.taskListId) {
			console.log(
				`✅ Tentative de réutilisation de la liste (ID: ${this.taskListId})`
			);
			// Tester si la liste existe encore
			try {
				const accessToken = await this.getAccessToken();
				const testResponse = await fetch(
					`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
						this.taskListId
					)}/tasks?maxResults=1`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);

				if (testResponse.ok) {
					console.log(`✅ Liste (ID: ${this.taskListId}) toujours valide`);
					return this.taskListId;
				} else if (testResponse.status === 404) {
					console.warn(
						`⚠️ Liste sauvegardée (ID: ${this.taskListId}) n'existe plus, réinitialisation...`
					);
					// La liste n'existe plus, réinitialiser taskListId
					this.taskListId = null;
					localStorage.removeItem(this.STORAGE_KEY);
				} else {
					console.warn(
						`⚠️ Erreur lors de la vérification de la liste (${testResponse.status}), réinitialisation...`
					);
					this.taskListId = null;
					localStorage.removeItem(this.STORAGE_KEY);
				}
			} catch (error) {
				console.warn(
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
			console.log(
				`📋 ${taskLists.length} liste(s) trouvée(s):`,
				taskLists.map((l) => l.title)
			);

			// 1. Chercher une liste "Dashboard Personnel" existante pour éviter les doublons
			let defaultList = taskLists.find(
				(list) => list.title === "Dashboard Personnel"
			);

			if (defaultList) {
				console.log(
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
				console.log(
					`✅ Liste "${defaultList.title}" trouvée (ID: ${defaultList.id})`
				);
				this.saveTaskListId(defaultList.id);
				return this.taskListId!;
			}

			// 3. La liste "@default" existe toujours dans Google Tasks et correspond à "Mes Tâches"
			// Elle peut ne pas apparaître dans getAllTaskLists(), mais on peut toujours y accéder directement
			// Testons si on peut accéder à @default
			try {
				const testResponse = await fetch(
					"https://www.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=1",
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);

				if (testResponse.ok) {
					console.log("✅ Utilisation de la liste @default (Mes Tâches)");
					this.saveTaskListId("@default");
					return this.taskListId!;
				} else {
					const errorData = await testResponse.json().catch(() => ({}));
					console.warn(
						`⚠️ @default non accessible (${testResponse.status}):`,
						errorData
					);
				}
			} catch (testError) {
				console.warn("⚠️ Erreur lors du test de @default:", testError);
			}

			// 4. Dernier recours : créer une nouvelle liste seulement si vraiment nécessaire
			// MAIS on vérifie d'abord qu'on n'a pas déjà une liste "Dashboard Personnel" créée récemment
			console.warn(
				"⚠️ Aucune liste par défaut trouvée, vérification finale avant création..."
			);

			// Attendre un peu et re-vérifier les listes (au cas où une autre instance aurait créé une liste)
			await new Promise((resolve) => setTimeout(resolve, 500));
			const taskListsRecheck = await this.getAllTaskLists();
			const existingDashboardList = taskListsRecheck.find(
				(list) => list.title === "Dashboard Personnel"
			);

			if (existingDashboardList) {
				console.log(
					`✅ Liste "Dashboard Personnel" trouvée lors de la re-vérification (ID: ${existingDashboardList.id})`
				);
				this.saveTaskListId(existingDashboardList.id);
				return this.taskListId!;
			}

			// Créer une nouvelle liste seulement si vraiment aucune autre option ne fonctionne
			console.warn("⚠️ Création d'une nouvelle liste 'Dashboard Personnel'...");
			const response = await fetch(
				"https://www.googleapis.com/tasks/v1/users/@me/lists",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						title: "Dashboard Personnel",
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Erreur lors de la création de la liste: ${
						response.statusText
					} - ${JSON.stringify(errorData)}`
				);
			}

			const newList = (await response.json()) as GoogleTaskList;
			console.log(
				`✅ Nouvelle liste créée: "${newList.title}" (ID: ${newList.id})`
			);
			this.taskListId = newList.id;
			return this.taskListId;
		} catch (error) {
			console.error(
				"Erreur lors de la récupération/création de la liste:",
				error
			);
			throw error;
		}
	}

	/**
	 * Convertit une tâche Google en Todo local
	 */
	private convertFromGoogleTask(googleTask: GoogleTask): Todo {
		let deadline: string | undefined;

		if (googleTask.due) {
			// Google Tasks peut utiliser soit RFC 3339 complet, soit juste la date
			try {
				if (googleTask.due.includes("T")) {
					const dateTime = parseISO(googleTask.due);
					deadline = format(dateTime, "yyyy-MM-dd");
				} else {
					// Format date seule (YYYY-MM-DD)
					deadline = googleTask.due;
				}
			} catch {
				console.warn("Erreur lors du parsing de la date:", googleTask.due);
				deadline = undefined;
			}
		}

		// Google Tasks n'a pas de champ "priority" natif, on peut utiliser les notes ou un système de tags
		// Pour l'instant, on ne mappe pas la priorité
		const priority = false;

		return {
			id: googleTask.id || crypto.randomUUID(),
			title: googleTask.title || "Sans titre",
			completed: googleTask.status === "completed",
			priority,
			createdAt: googleTask.updated
				? new Date(googleTask.updated).getTime()
				: Date.now(),
			deadline,
		};
	}

	/**
	 * Convertit un Todo local en tâche Google
	 */
	private convertToGoogleTask(todo: Todo): Partial<GoogleTask> {
		const googleTask: Partial<GoogleTask> = {
			title: todo.title || "", // Titre requis, ne peut pas être vide
			status: todo.completed ? "completed" : "needsAction",
		};

		// Convertir la deadline en format Google Tasks
		if (todo.deadline) {
			// Google Tasks accepte soit RFC 3339, soit date seule (YYYY-MM-DD)
			// Pour les deadlines, on utilise le format date seule (YYYY-MM-DD)
			// S'assurer que le format est correct (YYYY-MM-DD)
			const deadlineMatch = todo.deadline.match(/^\d{4}-\d{2}-\d{2}$/);
			if (deadlineMatch) {
				googleTask.due = todo.deadline;
			} else {
				// Si le format n'est pas correct, essayer de le convertir
				try {
					const date = parseISO(todo.deadline);
					googleTask.due = format(date, "yyyy-MM-dd");
				} catch {
					console.warn(
						`Format de deadline invalide pour "${todo.title}": ${todo.deadline}`
					);
					// Ne pas inclure due si le format est invalide
				}
			}
		}

		// Si la tâche est complétée, ajouter la date de complétion au format RFC 3339
		if (todo.completed) {
			googleTask.completed = new Date().toISOString();
		}

		return googleTask;
	}

	/**
	 * Synchronise les tâches (pull depuis Google Tasks)
	 */
	async pullTodos(listId?: string): Promise<Todo[]> {
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		const taskListId = listId || (await this.getOrCreateDefaultTaskList());
		const accessToken = await this.getAccessToken();
		const todos: Todo[] = [];
		let pageToken: string | undefined;

		do {
			const params = new URLSearchParams({
				showCompleted: "true",
				showHidden: "false",
				maxResults: "100",
			});

			if (pageToken) {
				params.append("pageToken", pageToken);
			}

			try {
				const response = await fetch(
					`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
						taskListId
					)}/tasks?${params.toString()}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);

				if (!response.ok) {
					if (response.status === 404) {
						console.warn(`⚠️ Liste de tâches ${taskListId} non trouvée (404)`);
						// La liste n'existe plus, réinitialiser taskListId
						this.taskListId = null;
						localStorage.removeItem(this.STORAGE_KEY);
						// Réessayer avec une nouvelle liste
						const newTaskListId = await this.getOrCreateDefaultTaskList();
						console.log(
							`🔄 Nouvelle liste obtenue (ID: ${newTaskListId}), réessai...`
						);
						return await this.pullTodos(newTaskListId);
					}
					const error = await response.json();
					throw new Error(
						`Erreur lors de la récupération: ${
							error.error?.message || response.statusText
						}`
					);
				}

				const data = (await response.json()) as GoogleTasksResponse;

				for (const googleTask of data.items || []) {
					try {
						// Ignorer les tâches supprimées ou cachées
						if (googleTask.deleted || googleTask.hidden) {
							continue;
						}

						const localTodo = this.convertFromGoogleTask(googleTask);
						// Préfixer l'ID avec "google-" pour identifier l'origine
						if (googleTask.id) {
							localTodo.id = `google-${googleTask.id}`;
						}
						todos.push(localTodo);
					} catch (error) {
						console.error("Erreur lors de la conversion d'une tâche:", error);
					}
				}

				pageToken = data.nextPageToken;
			} catch (error) {
				console.error("Erreur lors de la récupération des tâches:", error);
				break;
			}
		} while (pageToken);

		console.log(`✅ ${todos.length} tâche(s) récupérée(s) depuis Google Tasks`);
		return todos;
	}

	/**
	 * Pousse les tâches vers Google Tasks
	 */
	async pushTodos(todos: Todo[], listId?: string): Promise<void> {
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		const taskListId = listId || (await this.getOrCreateDefaultTaskList());
		const accessToken = await this.getAccessToken();

		for (const todo of todos) {
			try {
				const googleTask = this.convertToGoogleTask(todo);

				// Si la tâche a un ID Google, mettre à jour
				if (todo.id && todo.id.startsWith("google-")) {
					const googleTaskId = todo.id.replace("google-", "");

					const response = await fetch(
						`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
							taskListId
						)}/tasks/${googleTaskId}`,
						{
							method: "PATCH",
							headers: {
								Authorization: `Bearer ${accessToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(googleTask),
						}
					);

					if (!response.ok && response.status !== 404) {
						const error = await response.json();
						throw new Error(
							`Erreur lors de la mise à jour: ${
								error.error?.message || response.statusText
							}`
						);
					}
				} else {
					// Sinon, créer une nouvelle tâche
					// Nettoyer l'objet googleTask pour n'inclure que les champs valides
					const taskToCreate: Partial<GoogleTask> = {};
					if (googleTask.title) {
						taskToCreate.title = googleTask.title;
					}
					if (googleTask.status) {
						taskToCreate.status = googleTask.status;
					}
					if (googleTask.due) {
						taskToCreate.due = googleTask.due;
					}
					if (googleTask.completed) {
						taskToCreate.completed = googleTask.completed;
					}
					if (googleTask.notes) {
						taskToCreate.notes = googleTask.notes;
					}

					console.log(
						`📤 Création d'une tâche dans Google Tasks:`,
						taskToCreate
					);

					const response = await fetch(
						`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
							taskListId
						)}/tasks`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${accessToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(taskToCreate),
						}
					);

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						const errorMessage =
							errorData.error?.message || response.statusText;
						console.error(`❌ Erreur lors de la création:`, errorData);
						throw new Error(`Erreur lors de la création: ${errorMessage}`);
					}

					// Si la création réussit, récupérer la tâche créée
					try {
						const createdTask = (await response.json()) as GoogleTask;
						if (createdTask.id) {
							console.log(
								`✅ Tâche créée dans Google Tasks avec l'ID: ${createdTask.id}`
							);
							// L'ID sera mis à jour lors de la prochaine synchronisation
						}
					} catch (parseError) {
						console.warn(
							"Impossible de parser la réponse de création:",
							parseError
						);
					}
				}
			} catch (error) {
				console.error(`Erreur lors du push de la tâche ${todo.id}:`, error);
				// Continuer avec les autres tâches
			}
		}
	}

	/**
	 * Supprime une tâche de Google Tasks
	 */
	async deleteTask(taskId: string, listId?: string): Promise<void> {
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		const taskListId = listId || (await this.getOrCreateDefaultTaskList());
		const accessToken = await this.getAccessToken();

		// Extraire l'ID Google si c'est un ID préfixé
		const googleTaskId = taskId.startsWith("google-")
			? taskId.replace("google-", "")
			: taskId;

		try {
			const response = await fetch(
				`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
					taskListId
				)}/tasks/${googleTaskId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			if (!response.ok && response.status !== 404) {
				const error = await response.json();
				throw new Error(
					`Erreur lors de la suppression: ${
						error.error?.message || response.statusText
					}`
				);
			}
		} catch (error) {
			console.error(
				"Erreur lors de la suppression de la tâche Google Tasks:",
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
