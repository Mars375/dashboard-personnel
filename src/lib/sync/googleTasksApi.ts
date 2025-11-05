/**
 * Appels API Google Tasks
 */

import { logger } from "@/lib/logger";
import { SyncError } from "@/lib/errors";
import {
	validateGoogleTasksResponse,
	validateGoogleTasksListResponse,
	validateGoogleTaskList,
	safeValidateGoogleTask,
	type GoogleTask,
	type GoogleTaskList,
} from "./googleTasksValidation";

export interface GoogleTasksApiOptions {
	accessToken: string;
	retryWithBackoff?: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Récupère toutes les listes de tâches disponibles
 */
export async function getAllTaskLists(
	options: GoogleTasksApiOptions
): Promise<GoogleTaskList[]> {
	try {
		const { accessToken, retryWithBackoff } = options;
		const taskLists: GoogleTaskList[] = [];
		let pageToken: string | undefined;

		do {
			const params = new URLSearchParams();
			if (pageToken) {
				params.append("pageToken", pageToken);
			}

			const fetchFn = async () => {
				const response = await fetch(
					`https://www.googleapis.com/tasks/v1/users/@me/lists?${params.toString()}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);

				if (!response.ok) {
					throw SyncError.fromError(
						new Error(
							`Erreur lors de la récupération des listes: ${response.statusText}`
						)
					);
				}

				const rawData = await response.json();
				return validateGoogleTasksListResponse(rawData);
			};

			const data = retryWithBackoff ? await retryWithBackoff(fetchFn) : await fetchFn();

			taskLists.push(...data.items);
			pageToken = data.nextPageToken;
		} while (pageToken);

		return taskLists;
	} catch (error) {
		logger.error(
			"Erreur lors de la récupération des listes de tâches:",
			error
		);
		throw error;
	}
}

/**
 * Récupère les tâches d'une liste
 */
export async function getTasks(
	taskListId: string,
	options: GoogleTasksApiOptions
): Promise<GoogleTask[]> {
	const { accessToken, retryWithBackoff } = options;
	const todos: GoogleTask[] = [];
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

		const fetchFn = async () => {
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
					logger.warn(`⚠️ Liste de tâches ${taskListId} non trouvée (404)`);
					throw new Error(`Liste non trouvée: ${taskListId}`);
				}
				const error = await response.json();
				throw new Error(
					`Erreur lors de la récupération des tâches: ${response.statusText} - ${JSON.stringify(error)}`
				);
			}

			const rawData = await response.json();
			return validateGoogleTasksResponse(rawData);
		};

		const data = retryWithBackoff ? await retryWithBackoff(fetchFn) : await fetchFn();

		todos.push(...data.items);
		pageToken = data.nextPageToken;
	} while (pageToken);

	return todos;
}

/**
 * Teste si une liste existe
 */
export async function testTaskList(
	taskListId: string,
	options: GoogleTasksApiOptions
): Promise<boolean> {
	try {
		const { accessToken } = options;
		const response = await fetch(
			`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
				taskListId
			)}/tasks?maxResults=1`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		return response.ok;
	} catch (error) {
		logger.warn("Erreur lors du test de la liste:", error);
		return false;
	}
}

/**
 * Crée une nouvelle liste de tâches
 */
export async function createTaskList(
	title: string,
	options: GoogleTasksApiOptions
): Promise<GoogleTaskList> {
	const { accessToken } = options;
	const response = await fetch(
		"https://www.googleapis.com/tasks/v1/users/@me/lists",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title,
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

	const rawData = await response.json();
	return validateGoogleTaskList(rawData);
}

/**
 * Crée une nouvelle tâche
 */
export async function createTask(
	taskListId: string,
	task: Partial<GoogleTask>,
	options: GoogleTasksApiOptions
): Promise<GoogleTask> {
	const { accessToken } = options;
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
			body: JSON.stringify(task),
		}
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			`Erreur lors de la création de la tâche: ${
				response.statusText
			} - ${JSON.stringify(errorData)}`
		);
	}

	const rawData = await response.json();
	const validated = safeValidateGoogleTask(rawData);
	if (!validated) {
		throw new Error("Tâche créée invalide");
	}
	return validated;
}

/**
 * Met à jour une tâche
 */
export async function updateTask(
	taskListId: string,
	taskId: string,
	updates: Partial<GoogleTask>,
	options: GoogleTasksApiOptions
): Promise<GoogleTask> {
	const { accessToken } = options;
	const response = await fetch(
		`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
			taskListId
		)}/tasks/${encodeURIComponent(taskId)}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(updates),
		}
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			`Erreur lors de la mise à jour de la tâche: ${
				response.statusText
			} - ${JSON.stringify(errorData)}`
		);
	}

	const rawData = await response.json();
	const validated = safeValidateGoogleTask(rawData);
	if (!validated) {
		throw new Error("Tâche créée invalide");
	}
	return validated;
}

/**
 * Supprime une tâche
 */
export async function deleteTask(
	taskId: string,
	taskListId: string,
	options: GoogleTasksApiOptions
): Promise<void> {
	const { accessToken } = options;
	const response = await fetch(
		`https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(
			taskListId
		)}/tasks/${encodeURIComponent(taskId)}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			`Erreur lors de la suppression de la tâche: ${
				response.statusText
			} - ${JSON.stringify(errorData)}`
		);
	}
}

