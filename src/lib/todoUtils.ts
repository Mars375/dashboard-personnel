/**
 * Utilitaires pour les tâches
 */

import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/store/todoStorage";

/**
 * Récupère les tâches actuelles depuis le store Zustand
 * @returns Tableau des tâches actuelles
 */
export function getCurrentTodos(): Todo[] {
	const store = useTodoStore.getState();
	return store.present;
}

/**
 * Récupère une tâche par son ID depuis le store
 * @param todoId ID de la tâche à récupérer
 * @returns La tâche trouvée ou undefined
 */
export function getTodoById(todoId: string): Todo | undefined {
	const todos = getCurrentTodos();
	return todos.find((t) => t.id === todoId);
}

/**
 * Récupère une tâche par son titre depuis le store
 * @param title Titre de la tâche à récupérer
 * @param excludeCompleted Exclure les tâches complétées
 * @returns La tâche trouvée ou undefined
 */
export function getTodoByTitle(
	title: string,
	excludeCompleted = true
): Todo | undefined {
	const todos = getCurrentTodos();
	const filtered = excludeCompleted
		? todos.filter((t) => !t.completed)
		: todos;
	return filtered
		.filter((t) => t.title === title)
		.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]; // La plus récente
}

