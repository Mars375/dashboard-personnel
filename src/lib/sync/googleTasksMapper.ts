/**
 * Mapper pour convertir entre Todo local et GoogleTask
 */

import { format, parseISO } from "date-fns";
import { logger } from "@/lib/logger";
import type { Todo } from "@/store/todoStorage";
import type { GoogleTask } from "./googleTasksValidation";

/**
 * Convertit une tâche Google en Todo local
 */
export function convertFromGoogleTask(googleTask: GoogleTask): Todo {
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
			logger.warn("Erreur lors du parsing de la date:", googleTask.due);
			deadline = undefined;
		}
	}

	// La priorité n'est pas synchronisée avec Google Tasks
	// Les tâches importées depuis Google Tasks n'ont pas de priorité par défaut
	// (l'utilisateur peut la définir manuellement en local)
	const priority = false;
	const title = googleTask.title || "Sans titre";

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
export function convertToGoogleTask(todo: Todo): Partial<GoogleTask> {
	// La priorité n'est pas synchronisée avec Google Tasks
	// (l'API Google Tasks ne supporte pas le statut "suivi")
	// On utilise le titre tel quel, sans préfixe ⭐
	const title = todo.title || "";

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
	// Selon la doc: "Date prévue pour la tâche (sous forme de code temporel RFC 3339)"
	// Format requis: RFC 3339 complet (YYYY-MM-DDTHH:mm:ss.sssZ)
	// Même si seule la date est utilisée, l'API peut exiger le format complet
	if (todo.deadline) {
		try {
			let date: Date;
			const deadlineMatch = todo.deadline.match(/^\d{4}-\d{2}-\d{2}$/);
			if (deadlineMatch) {
				// Format YYYY-MM-DD, créer une date à minuit UTC
				const [year, month, day] = todo.deadline.split("-").map(Number);
				date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
			} else {
				// Format déjà parsable, utiliser parseISO
				date = parseISO(todo.deadline);
			}

			if (isNaN(date.getTime())) {
				logger.warn(`Date invalide pour "${todo.title}": ${todo.deadline}`);
			} else {
				// Utiliser le format RFC 3339 complet (YYYY-MM-DDTHH:mm:ss.sssZ)
				// Même si seule la date est utilisée, l'API peut exiger ce format
				googleTask.due = date.toISOString();
			}
		} catch (error) {
			logger.warn(
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

	// La priorité n'est pas synchronisée avec Google Tasks
	// Les notes sont laissées telles quelles (pas de métadonnées de priorité)

	return googleTask;
}


