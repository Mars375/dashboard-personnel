import { useEffect } from "react";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/store/todoStorage";

export type TodoFilter = "all" | "active" | "completed" | "priority";

export function useTodos() {
	const {
		present: todos,
		currentListId,
		lists,
		setCurrentList,
		addList,
		renameList,
		deleteList,
		addTodo,
		toggleTodo,
		deleteTodo,
		editTodo,
		togglePriority,
		setDeadline,
		updateTodoId,
		undo,
		redo,
		canUndo,
		canRedo,
		initialize,
	} = useTodoStore();

	// Initialize from localStorage on mount
	useEffect(() => {
		initialize();
	}, [initialize]);

	const filteredTodos = (filter: TodoFilter, searchQuery?: string): Todo[] => {
		let result: Todo[] = todos;

		// Apply filter
		switch (filter) {
			case "active":
				result = todos.filter((todo) => !todo.completed);
				break;
			case "completed":
				result = todos.filter((todo) => todo.completed);
				break;
			case "priority":
				result = todos.filter((todo) => todo.priority);
				break;
			default:
				result = todos;
		}

		// Apply search query
		if (searchQuery?.trim()) {
			const query = searchQuery.trim().toLowerCase();
			result = result.filter((todo) =>
				todo.title.toLowerCase().includes(query)
			);
		}

		// Sort: priority first, then by deadline (overdue first), then by creation date
		return result.sort((a, b) => {
			// Priority first
			if (a.priority && !b.priority) return -1;
			if (!a.priority && b.priority) return 1;

			// Then by deadline (overdue first)
			if (a.deadline && b.deadline) {
				const dateA = new Date(a.deadline).getTime();
				const dateB = new Date(b.deadline).getTime();
				const now = Date.now();
				const aOverdue = dateA < now && !a.completed;
				const bOverdue = dateB < now && !b.completed;

				if (aOverdue && !bOverdue) return -1;
				if (!aOverdue && bOverdue) return 1;
				if (aOverdue && bOverdue) return dateA - dateB; // Both overdue, earliest first
				return dateA - dateB; // Both not overdue, earliest first
			}
			if (a.deadline && !b.deadline) return -1;
			if (!a.deadline && b.deadline) return 1;

			// Finally by creation date (newest first)
			return b.createdAt - a.createdAt;
		});
	};

	const activeCount = todos.filter((todo) => !todo.completed).length;
	const completedCount = todos.filter((todo) => todo.completed).length;
	const priorityCount = todos.filter(
		(todo) => todo.priority && !todo.completed
	).length;
	const overdueCount = todos.filter((todo) => {
		if (todo.completed || !todo.deadline) return false;
		return new Date(todo.deadline).getTime() < Date.now();
	}).length;

	return {
		todos,
		currentListId,
		lists,
		setCurrentList,
		addList,
		renameList,
		deleteList,
		addTodo,
		toggleTodo,
		deleteTodo,
		editTodo,
		togglePriority,
		setDeadline,
		updateTodoId,
		filteredTodos,
		activeCount,
		completedCount,
		priorityCount,
		overdueCount,
		// History actions
		undo,
		redo,
		canUndo: canUndo(),
		canRedo: canRedo(),
	};
}
