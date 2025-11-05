/**
 * Utilitaires pour les tâches
 */

import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/store/todoStorage";
import type { TodoList } from "@/store/todoLists";

/**
 * Récupère les tâches actuelles depuis le store Zustand
 * @returns Tableau des tâches actuelles
 */
export function getCurrentTodos(): Todo[] {
	const store = useTodoStore.getState();
	return store.present;
}

/**
 * Récupère les listes actuelles depuis le store Zustand
 * @returns Tableau des listes actuelles
 */
export function getCurrentLists(): TodoList[] {
	const store = useTodoStore.getState();
	return store.lists;
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
	const filtered = excludeCompleted ? todos.filter((t) => !t.completed) : todos;
	return filtered
		.filter((t) => t.title === title)
		.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]; // La plus récente
}

/**
 * Attend que la liste soit ajoutée au store
 * @param listName Nom de la liste à attendre
 * @param timeout Timeout en millisecondes (défaut: 2000ms)
 * @returns Promise qui se résout quand la liste est trouvée ou timeout
 */
export function waitForListAdded(
	listName: string,
	timeout = 2000
): Promise<TodoList | undefined> {
	return new Promise((resolve) => {
		// Vérifier immédiatement si la liste existe déjà
		const currentLists = getCurrentLists();
		const found = currentLists.find((l) => l.name === listName);
		if (found) {
			resolve(found);
			return;
		}

		// Utiliser subscribe si disponible, sinon fallback avec polling
		if (typeof useTodoStore.subscribe === "function") {
			let unsubscribe: (() => void) | undefined;
			const timeoutId = setTimeout(() => {
				if (unsubscribe) {
					unsubscribe();
				}
				resolve(undefined);
			}, timeout);

			unsubscribe = useTodoStore.subscribe((state) => {
				const found = state.lists.find((l) => l.name === listName);
				if (found) {
					clearTimeout(timeoutId);
					if (unsubscribe) {
						unsubscribe();
					}
					resolve(found);
				}
			});
		} else {
			// Fallback : polling simple si subscribe n'est pas disponible
			let attempts = 0;
			const maxAttempts = Math.floor(timeout / 100);
			const intervalId = setInterval(() => {
				attempts++;
				const currentLists = getCurrentLists();
				const found = currentLists.find((l) => l.name === listName);
				if (found || attempts >= maxAttempts) {
					clearInterval(intervalId);
					resolve(found);
				}
			}, 100);
		}
	});
}

/**
 * Attend que la liste actuelle change
 * @param expectedListId ID de la liste attendue
 * @param timeout Timeout en millisecondes (défaut: 1000ms)
 * @returns Promise qui se résout quand la liste actuelle correspond ou timeout
 */
export function waitForCurrentListChanged(
	expectedListId: string,
	timeout = 1000
): Promise<boolean> {
	return new Promise((resolve) => {
		// Vérifier immédiatement si la liste actuelle correspond déjà
		const currentListId = useTodoStore.getState().currentListId;
		if (currentListId === expectedListId) {
			resolve(true);
			return;
		}

		// Utiliser subscribe si disponible, sinon fallback avec polling
		if (typeof useTodoStore.subscribe === "function") {
			let unsubscribe: (() => void) | undefined;
			const timeoutId = setTimeout(() => {
				if (unsubscribe) {
					unsubscribe();
				}
				resolve(false);
			}, timeout);

			unsubscribe = useTodoStore.subscribe((state) => {
				if (state.currentListId === expectedListId) {
					clearTimeout(timeoutId);
					if (unsubscribe) {
						unsubscribe();
					}
					resolve(true);
				}
			});
		} else {
			// Fallback : polling simple si subscribe n'est pas disponible
			let attempts = 0;
			const maxAttempts = Math.floor(timeout / 100);
			const intervalId = setInterval(() => {
				attempts++;
				const currentListId = useTodoStore.getState().currentListId;
				if (currentListId === expectedListId || attempts >= maxAttempts) {
					clearInterval(intervalId);
					resolve(currentListId === expectedListId);
				}
			}, 100);
		}
	});
}
