/**
 * Validation des données Google Tasks API avec Zod
 * Valide les réponses de l'API avant de les utiliser
 */

import { z } from "zod";
import { SyncError, SyncErrorCode } from "@/lib/errors";

/**
 * Schéma de validation pour une tâche Google Tasks
 */
export const GoogleTaskSchema = z.object({
	id: z.string().optional(),
	title: z.string().optional(),
	notes: z.string().optional(),
	status: z.enum(["needsAction", "completed"]).optional(),
	due: z.string().optional(), // RFC 3339 format ou date seule
	completed: z.string().optional(), // RFC 3339 format
	updated: z.string().optional(), // RFC 3339 format
	position: z.string().optional(),
	parent: z.string().optional(),
	deleted: z.boolean().optional(),
	hidden: z.boolean().optional(),
});

/**
 * Schéma de validation pour une liste de tâches Google Tasks
 */
export const GoogleTaskListSchema = z.object({
	id: z.string(),
	title: z.string(),
	updated: z.string().optional(),
});

/**
 * Schéma de validation pour la réponse de l'API Google Tasks (liste de tâches)
 */
export const GoogleTasksResponseSchema = z.object({
	items: z.array(GoogleTaskSchema),
	nextPageToken: z.string().optional(),
});

/**
 * Schéma de validation pour la réponse de l'API Google Tasks (liste de listes)
 */
export const GoogleTasksListResponseSchema = z.object({
	items: z.array(GoogleTaskListSchema),
	nextPageToken: z.string().optional(),
});

/**
 * Type TypeScript dérivé du schéma GoogleTask
 */
export type GoogleTask = z.infer<typeof GoogleTaskSchema>;

/**
 * Type TypeScript dérivé du schéma GoogleTaskList
 */
export type GoogleTaskList = z.infer<typeof GoogleTaskListSchema>;

/**
 * Type TypeScript dérivé du schéma GoogleTasksResponse
 */
export type GoogleTasksResponse = z.infer<typeof GoogleTasksResponseSchema>;

/**
 * Type TypeScript dérivé du schéma GoogleTasksListResponse
 */
export type GoogleTasksListResponse = z.infer<typeof GoogleTasksListResponseSchema>;

/**
 * Valide une tâche Google Tasks
 * @param data Données à valider
 * @returns Tâche validée
 * @throws SyncError si la validation échoue
 */
export function validateGoogleTask(data: unknown): GoogleTask {
	try {
		return GoogleTaskSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new SyncError(
				`Données de tâche invalides: ${error.errors.map(e => e.message).join(", ")}`,
				SyncErrorCode.VALIDATION_ERROR,
				false,
				error
			);
		}
		throw SyncError.fromError(error);
	}
}

/**
 * Valide une liste de tâches Google Tasks
 * @param data Données à valider
 * @returns Liste de tâches validée
 * @throws SyncError si la validation échoue
 */
export function validateGoogleTaskList(data: unknown): GoogleTaskList {
	try {
		return GoogleTaskListSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new SyncError(
				`Données de liste invalides: ${error.errors.map(e => e.message).join(", ")}`,
				SyncErrorCode.VALIDATION_ERROR,
				false,
				error
			);
		}
		throw SyncError.fromError(error);
	}
}

/**
 * Valide la réponse de l'API Google Tasks (liste de tâches)
 * @param data Données à valider
 * @returns Réponse validée
 * @throws SyncError si la validation échoue
 */
export function validateGoogleTasksResponse(data: unknown): GoogleTasksResponse {
	try {
		return GoogleTasksResponseSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new SyncError(
				`Réponse API invalide: ${error.errors.map(e => e.message).join(", ")}`,
				SyncErrorCode.VALIDATION_ERROR,
				false,
				error
			);
		}
		throw SyncError.fromError(error);
	}
}

/**
 * Valide la réponse de l'API Google Tasks (liste de listes)
 * @param data Données à valider
 * @returns Réponse validée
 * @throws SyncError si la validation échoue
 */
export function validateGoogleTasksListResponse(
	data: unknown
): GoogleTasksListResponse {
	try {
		return GoogleTasksListResponseSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new SyncError(
				`Réponse API invalide: ${error.errors.map(e => e.message).join(", ")}`,
				SyncErrorCode.VALIDATION_ERROR,
				false,
				error
			);
		}
		throw SyncError.fromError(error);
	}
}

/**
 * Valide de manière sécurisée une tâche Google Tasks (retourne null si invalide)
 * @param data Données à valider
 * @returns Tâche validée ou null si invalide
 */
export function safeValidateGoogleTask(data: unknown): GoogleTask | null {
	try {
		return validateGoogleTask(data);
	} catch {
		return null;
	}
}

/**
 * Valide de manière sécurisée une liste de tâches Google Tasks (retourne null si invalide)
 * @param data Données à valider
 * @returns Liste validée ou null si invalide
 */
export function safeValidateGoogleTaskList(data: unknown): GoogleTaskList | null {
	try {
		return validateGoogleTaskList(data);
	} catch {
		return null;
	}
}

