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
	private taskListId: string | null = null; // ID de la liste de tâches par défaut
	private readonly STORAGE_KEY = "googleTasks_taskListId"; // Clé pour persister le taskListId
	private readonly MAX_RETRIES = 3; // Nombre maximum de tentatives en cas d'erreur
	private readonly RETRY_DELAY = 1000; // Délai entre les tentatives (ms)

	constructor(config: SyncConfig) {
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
	 * Fonction utilitaire pour retry automatique en cas d'erreur réseau
	 */
	private async retryWithBackoff<T>(
		fn: () => Promise<T>,
		retries = this.MAX_RETRIES
	): Promise<T> {
		try {
			return await fn();
		} catch (error) {
			if (retries > 0) {
				// Vérifier si c'est une erreur réseau ou temporaire
				const isRetryable =
					error instanceof Error &&
					(error.message.includes("network") ||
						error.message.includes("timeout") ||
						error.message.includes("fetch") ||
						error.message.includes("500") ||
						error.message.includes("503") ||
						error.message.includes("429"));

				if (isRetryable) {
					console.log(
						`🔄 Tentative de retry (${this.MAX_RETRIES - retries + 1}/${this.MAX_RETRIES})...`
					);
					await new Promise((resolve) =>
						setTimeout(resolve, this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1))
					);
					return this.retryWithBackoff(fn, retries - 1);
				}
			}
			throw error;
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

		// Extraire la priorité depuis les notes (format JSON) ou le préfixe ⭐ dans le titre
		let priority = false;
		let title = googleTask.title || "Sans titre";
		
		// Vérifier d'abord le préfixe visuel dans le titre
		if (title.startsWith("⭐")) {
			priority = true;
			// Retirer le préfixe du titre pour l'affichage local
			title = title.replace(/^⭐\s*/, "");
		}
		
		// Vérifier aussi dans les notes (pour compatibilité)
		if (googleTask.notes) {
			try {
				const metadata = JSON.parse(googleTask.notes);
				if (metadata && typeof metadata.priority === "boolean") {
					priority = metadata.priority;
				}
			} catch {
				// Si les notes ne sont pas du JSON, vérifier si elles contiennent la priorité
				if (googleTask.notes.includes('"priority":true') || googleTask.notes.includes("priority:true")) {
					priority = true;
				}
			}
		}

		return {
			id: googleTask.id || crypto.randomUUID(),
			title,
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
		// Ajouter un préfixe visuel pour les tâches prioritaires (⭐)
		// Cela permet de voir la priorité directement dans Google Tasks
		let title = todo.title || "";
		if (todo.priority && !title.startsWith("⭐")) {
			title = `⭐ ${title}`;
		} else if (!todo.priority && title.startsWith("⭐")) {
			// Retirer le préfixe si la priorité est désactivée
			title = title.replace(/^⭐\s*/, "");
		}

		const googleTask: Partial<GoogleTask> = {
			title, // Titre requis, ne peut pas être vide
			// Ne PAS définir status ici par défaut - on le gère dans pushTodos
			// status sera défini seulement si la tâche est complétée
		};
		
		// Définir status seulement si la tâche est complétée
		// Pour les nouvelles tâches, on n'inclura pas status (valeur par défaut: needsAction)
		if (todo.completed) {
			googleTask.status = "completed";
		}

		// Convertir la deadline en format Google Tasks
		if (todo.deadline) {
			// Google Tasks accepte le format RFC 3339 ou date seule (YYYY-MM-DD)
			// Pour éviter les erreurs, on utilise le format RFC 3339 avec minuit UTC
			try {
				let date: Date;
				const deadlineMatch = todo.deadline.match(/^\d{4}-\d{2}-\d{2}$/);
				if (deadlineMatch) {
					// Format YYYY-MM-DD, créer une date à minuit UTC
					const [year, month, day] = todo.deadline.split("-").map(Number);
					date = new Date(Date.UTC(year, month - 1, day));
				} else {
					// Format déjà parsable, utiliser parseISO
					date = parseISO(todo.deadline);
				}
				
				// Convertir en RFC 3339 (YYYY-MM-DDTHH:mm:ss.sssZ)
				// Pour une date complète, utiliser minuit UTC
				if (isNaN(date.getTime())) {
					console.warn(
						`Date invalide pour "${todo.title}": ${todo.deadline}`
					);
				} else {
					// Format RFC 3339 avec minuit UTC pour une date complète
					googleTask.due = date.toISOString().split("T")[0]; // YYYY-MM-DD (format accepté par Google Tasks)
				}
			} catch (error) {
				console.warn(
					`Erreur lors de la conversion de la deadline pour "${todo.title}": ${todo.deadline}`,
					error
				);
				// Ne pas inclure due si le format est invalide
			}
		}

		// Si la tâche est complétée, ajouter la date de complétion au format RFC 3339
		if (todo.completed) {
			googleTask.completed = new Date().toISOString();
		}

		// Stocker la priorité dans les notes (format JSON pour pouvoir stocker d'autres métadonnées)
		// Google Tasks n'a pas de champ natif pour la priorité, on utilise notes comme métadonnées
		// Note: cette information sera stockée dans les notes de Google Tasks, mais ne sera pas visible
		// comme "suivi" dans l'interface Google Tasks. C'est une limitation de l'API.
		// On pourrait aussi ajouter un préfixe "⭐" au titre pour une meilleure visibilité
		if (todo.priority) {
			try {
				// Si on a déjà des notes existantes, essayer de les parser et ajouter la priorité
				// Sinon, créer un nouveau JSON
				let metadata: any = {};
				if (googleTask.notes) {
					try {
						metadata = JSON.parse(googleTask.notes);
					} catch {
						// Si les notes ne sont pas du JSON, on les garde comme texte
						metadata = { text: googleTask.notes, priority: true };
					}
				}
				metadata.priority = true;
				googleTask.notes = JSON.stringify(metadata);
			} catch {
				// Si erreur, on peut aussi utiliser un préfixe dans le titre
				console.warn("Impossible de stocker la priorité dans les notes");
			}
		} else {
			// Si pas prioritaire, retirer la priorité des métadonnées mais garder le reste
			if (googleTask.notes) {
				try {
					const metadata = JSON.parse(googleTask.notes);
					if (metadata && typeof metadata === "object") {
						delete metadata.priority;
						// Si il reste seulement "text", on peut utiliser le texte directement
						if (Object.keys(metadata).length === 1 && metadata.text) {
							googleTask.notes = metadata.text;
						} else if (Object.keys(metadata).length > 0) {
							googleTask.notes = JSON.stringify(metadata);
						} else {
							// Plus de métadonnées, on peut supprimer les notes
							delete googleTask.notes;
						}
					}
				} catch {
					// Si les notes ne sont pas du JSON, on les garde comme elles sont
				}
			}
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
				const response = await this.retryWithBackoff(async () => {
					return await fetch(
						`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
							taskListId
						)}/tasks?${params.toString()}`,
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						}
					);
				});

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
	 * @returns Map des IDs locaux vers les IDs Google créés (pour les nouvelles tâches)
	 */
	async pushTodos(todos: Todo[], listId?: string): Promise<Map<string, string>> {
		const idMap = new Map<string, string>();
		if (!this.enabled) {
			throw new Error("Google Tasks sync is disabled");
		}

		const taskListId = listId || (await this.getOrCreateDefaultTaskList());
		const accessToken = await this.getAccessToken();

		for (const todo of todos) {
			try {
				const googleTask = this.convertToGoogleTask(todo);
				
				// Debug: log googleTask avant nettoyage (pour débogage seulement)
				if (process.env.NODE_ENV === "development") {
					console.log(`🔍 googleTask avant nettoyage:`, googleTask);
				}

				// Si la tâche a un ID Google, mettre à jour
				if (todo.id && todo.id.startsWith("google-")) {
					const googleTaskId = todo.id.replace("google-", "");

					const response = await this.retryWithBackoff(async () => {
						return await fetch(
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
					});

					if (!response.ok && response.status !== 404) {
						const error = await response.json().catch(() => ({}));
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
					
					// Titre (requis)
					if (googleTask.title && googleTask.title.trim()) {
						taskToCreate.title = googleTask.title.trim();
					} else {
						console.warn("⚠️ Tentative de créer une tâche sans titre, ignorée");
						continue; // Passer à la tâche suivante
					}
					
					// Ne PAS inclure status si c'est 'needsAction' (valeur par défaut)
					// Google Tasks API retourne une erreur 400 si on inclut status: 'needsAction' lors de la création
					// On n'inclut status QUE si c'est "completed"
					// IMPORTANT: googleTask.status peut être undefined maintenant (car on ne le définit plus par défaut)
					if (googleTask.status === "completed") {
						taskToCreate.status = "completed";
					}
					// Sinon, on ne met PAS status du tout (needsAction est la valeur par défaut de Google Tasks)
					// Si googleTask.status est undefined ou 'needsAction', on ne l'inclut pas
					
					// Date d'échéance (optionnelle)
					if (googleTask.due) {
						// Vérifier que le format est bien YYYY-MM-DD
						const dueMatch = googleTask.due.match(/^\d{4}-\d{2}-\d{2}$/);
						if (dueMatch) {
							taskToCreate.due = googleTask.due;
						} else {
							console.warn(
								`⚠️ Format de date invalide, ignoré: ${googleTask.due}`
							);
						}
					}
					
					// Date de complétion (seulement si complétée)
					if (googleTask.completed) {
						taskToCreate.completed = googleTask.completed;
					}
					
					// Notes (optionnelles)
					if (googleTask.notes) {
						taskToCreate.notes = googleTask.notes;
					}

					// Log détaillé pour débogage
					console.log(
						`📤 Création d'une tâche dans Google Tasks (taskToCreate nettoyé):`,
						JSON.stringify(taskToCreate, null, 2)
					);
					console.log(
						`📤 Payload qui sera envoyé (stringified):`,
						JSON.stringify(taskToCreate)
					);

					const response = await this.retryWithBackoff(async () => {
						const payload = JSON.stringify(taskToCreate);
						console.log(`📤 Envoi POST avec payload:`, payload);
						return await fetch(
							`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
								taskListId
							)}/tasks`,
							{
								method: "POST",
								headers: {
									Authorization: `Bearer ${accessToken}`,
									"Content-Type": "application/json",
								},
								body: payload,
							}
						);
					});

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						const errorMessage =
							errorData.error?.message || response.statusText;
						console.error(`❌ Erreur lors de la création:`, errorData);
						console.error(`📋 Payload envoyé:`, JSON.stringify(taskToCreate, null, 2));
						if (errorData.error?.errors) {
							console.error(`📋 Détails des erreurs:`, errorData.error.errors);
						}
						throw new Error(`Erreur lors de la création: ${errorMessage}`);
					}

					// Si la création réussit, récupérer la tâche créée et stocker l'ID
					try {
						const createdTask = (await response.json()) as GoogleTask;
						if (createdTask.id) {
							console.log(
								`✅ Tâche créée dans Google Tasks avec l'ID: ${createdTask.id}`
							);
							// Stocker le mapping de l'ID local vers l'ID Google
							idMap.set(todo.id, `google-${createdTask.id}`);
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
		return idMap;
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
			const response = await this.retryWithBackoff(async () => {
				return await fetch(
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
			});

			if (!response.ok && response.status !== 404) {
				const error = await response.json().catch(() => ({}));
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
