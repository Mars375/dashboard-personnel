/**
 * Utilitaire pour grouper et exécuter les opérations Google Tasks en parallèle
 * Optimise les performances en exécutant plusieurs requêtes simultanément
 */

import type { Todo } from "@/store/todoStorage";
import type { GoogleTask } from "./googleTasksValidation";
import { logger } from "@/lib/logger";
import { parseISO } from "date-fns";

/**
 * Types d'opérations sur les tâches
 */
export type TaskOperation = "create" | "update";

/**
 * Groupe une tâche avec son opération
 */
export interface TaskOperationGroup {
	todo: Todo;
	operation: TaskOperation;
	googleTask: GoogleTask;
	taskToSend: Partial<GoogleTask>;
	googleTaskId?: string; // Pour les mises à jour
}

/**
 * Résultat d'une opération de tâche
 */
export interface TaskOperationResult {
	todoId: string;
	success: boolean;
	googleId?: string;
	error?: string;
}

/**
 * Groupe les tâches par type d'opération
 */
export function groupTasksByOperation(
	todos: Todo[],
	convertToGoogleTask: (todo: Todo) => GoogleTask
): {
	creates: TaskOperationGroup[];
	updates: TaskOperationGroup[];
} {
	const creates: TaskOperationGroup[] = [];
	const updates: TaskOperationGroup[] = [];

	for (const todo of todos) {
		const googleTask = convertToGoogleTask(todo);

		// Si la tâche a un ID Google, c'est une mise à jour
		if (todo.id && todo.id.startsWith("google-")) {
			const googleTaskId = todo.id.replace("google-", "");
			const taskToUpdate = prepareTaskForUpdate(googleTask, todo);
			updates.push({
				todo,
				operation: "update",
				googleTask,
				taskToSend: taskToUpdate,
				googleTaskId,
			});
		} else {
			// Sinon, c'est une création
			const taskToCreate = prepareTaskForCreate(googleTask);
			if (taskToCreate.title) {
				// Ne créer que si la tâche a un titre
				creates.push({
					todo,
					operation: "create",
					googleTask,
					taskToSend: taskToCreate,
				});
			} else {
				logger.warn(
					`⚠️ Tentative de créer une tâche sans titre, ignorée: ${todo.id}`
				);
			}
		}
	}

	return { creates, updates };
}

/**
 * Prépare une tâche pour la mise à jour (PATCH)
 */
function prepareTaskForUpdate(
	googleTask: GoogleTask,
	todo: Todo
): Partial<GoogleTask> {
	const taskToUpdate: Partial<GoogleTask> = {};

	if (googleTask.title) {
		taskToUpdate.title = googleTask.title;
	}

	if (googleTask.status === "completed") {
		taskToUpdate.status = "completed";
		if (googleTask.completed) {
			taskToUpdate.completed = googleTask.completed;
		}
	} else if (googleTask.status === "needsAction" || !todo.completed) {
		taskToUpdate.status = "needsAction";
	}

	if (googleTask.due) {
		taskToUpdate.due = formatDateForGoogleTasks(googleTask.due);
	}

	if (googleTask.notes !== undefined) {
		taskToUpdate.notes = googleTask.notes;
	}

	return taskToUpdate;
}

/**
 * Prépare une tâche pour la création (POST)
 */
function prepareTaskForCreate(googleTask: GoogleTask): Partial<GoogleTask> {
	const taskToCreate: Partial<GoogleTask> = {};

	// Titre (requis)
	if (googleTask.title && googleTask.title.trim()) {
		taskToCreate.title = googleTask.title.trim();
	}

	// Ne PAS inclure status si c'est 'needsAction' (valeur par défaut)
	// Google Tasks API retourne une erreur 400 si on inclut status: 'needsAction' lors de la création
	if (googleTask.status === "completed") {
		taskToCreate.status = "completed";
	}

	// Date d'échéance
	if (googleTask.due) {
		taskToCreate.due = formatDateForGoogleTasks(googleTask.due);
	}

	// Date de complétion (seulement si complétée)
	if (googleTask.completed) {
		taskToCreate.completed = googleTask.completed;
	}

	// Notes
	if (googleTask.notes) {
		taskToCreate.notes = googleTask.notes;
	}

	// Vérification finale : ne JAMAIS inclure status si c'est needsAction
	if (taskToCreate.status === "needsAction") {
		delete taskToCreate.status;
	}

	return taskToCreate;
}

/**
 * Formate une date pour Google Tasks (RFC 3339)
 */
function formatDateForGoogleTasks(dateStr: string): string | undefined {
	// Vérifier si c'est déjà en format RFC 3339
	const isRFC3339 =
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(dateStr);
	if (isRFC3339) {
		return dateStr;
	}

	// Essayer de convertir
	try {
		let date: Date;
		if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
			// Format YYYY-MM-DD, créer une date à minuit UTC
			const [year, month, day] = dateStr.split("-").map(Number);
			date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
		} else {
			date = parseISO(dateStr);
		}

		if (!isNaN(date.getTime())) {
			return date.toISOString();
		}
	} catch {
		logger.warn(`⚠️ Format de date invalide, ignoré: ${dateStr}`);
	}

	return undefined;
}

/**
 * Taille maximale d'un batch pour éviter les rate limits
 */
const MAX_BATCH_SIZE = 10;

/**
 * Exécute les opérations de création en parallèle par batches
 */
export async function executeCreateBatch(
	creates: TaskOperationGroup[],
	taskListId: string,
	accessToken: string,
	executeCreate: (
		task: TaskOperationGroup,
		taskListId: string,
		accessToken: string
	) => Promise<TaskOperationResult>
): Promise<TaskOperationResult[]> {
	const results: TaskOperationResult[] = [];

	// Diviser en batches pour éviter les rate limits
	for (let i = 0; i < creates.length; i += MAX_BATCH_SIZE) {
		const batch = creates.slice(i, i + MAX_BATCH_SIZE);
		logger.debug(
			`📦 Exécution du batch de création ${Math.floor(i / MAX_BATCH_SIZE) + 1} (${batch.length} tâche(s))`
		);

		// Exécuter en parallèle
		const batchResults = await Promise.allSettled(
			batch.map((task) => executeCreate(task, taskListId, accessToken))
		);

		// Traiter les résultats
		for (let j = 0; j < batchResults.length; j++) {
			const result = batchResults[j];
			if (result.status === "fulfilled") {
				results.push(result.value);
			} else {
				results.push({
					todoId: batch[j].todo.id,
					success: false,
					error: result.reason?.message || "Erreur inconnue",
				});
			}
		}

		// Petit délai entre les batches pour éviter les rate limits
		if (i + MAX_BATCH_SIZE < creates.length) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	return results;
}

/**
 * Exécute les opérations de mise à jour en parallèle par batches
 */
export async function executeUpdateBatch(
	updates: TaskOperationGroup[],
	taskListId: string,
	accessToken: string,
	executeUpdate: (
		task: TaskOperationGroup,
		taskListId: string,
		accessToken: string
	) => Promise<TaskOperationResult>
): Promise<TaskOperationResult[]> {
	const results: TaskOperationResult[] = [];

	// Diviser en batches pour éviter les rate limits
	for (let i = 0; i < updates.length; i += MAX_BATCH_SIZE) {
		const batch = updates.slice(i, i + MAX_BATCH_SIZE);
		logger.debug(
			`📦 Exécution du batch de mise à jour ${Math.floor(i / MAX_BATCH_SIZE) + 1} (${batch.length} tâche(s))`
		);

		// Exécuter en parallèle
		const batchResults = await Promise.allSettled(
			batch.map((task) => executeUpdate(task, taskListId, accessToken))
		);

		// Traiter les résultats
		for (let j = 0; j < batchResults.length; j++) {
			const result = batchResults[j];
			if (result.status === "fulfilled") {
				results.push(result.value);
			} else {
				results.push({
					todoId: batch[j].todo.id,
					success: false,
					error: result.reason?.message || "Erreur inconnue",
				});
			}
		}

		// Petit délai entre les batches pour éviter les rate limits
		if (i + MAX_BATCH_SIZE < updates.length) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	return results;
}

