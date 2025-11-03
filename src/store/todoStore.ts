import { create } from "zustand";
import { loadTodos, saveTodos, type Todo } from "@/store/todoStorage";
import {
	loadTodoLists,
	saveTodoLists,
	setCurrentListId,
	type TodoList,
} from "@/store/todoLists";

interface TodoHistory {
	past: Todo[][];
	present: Todo[];
	future: Todo[][];
}

interface TodoStore extends TodoHistory {
	// Current list
	currentListId: string;
	lists: TodoList[];
	// Actions
	setCurrentList: (listId: string) => void;
	addList: (name: string) => void;
	renameList: (listId: string, name: string) => void;
	deleteList: (listId: string) => void;
	// Todo actions
	addTodo: (title: string, deadline?: string, id?: string, completed?: boolean, priority?: boolean, createdAt?: number) => void;
	toggleTodo: (id: string) => void;
	deleteTodo: (id: string) => void;
	editTodo: (id: string, title: string) => void;
	togglePriority: (id: string) => void;
	setDeadline: (id: string, deadline?: string) => void;
	// History actions
	undo: () => void;
	redo: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	// Initialize from localStorage
	initialize: () => void;
}

const MAX_HISTORY = 50; // Limit history size

const createHistoryState = (todos: Todo[]): TodoHistory => ({
	past: [],
	present: todos,
	future: [],
});

export const useTodoStore = create<TodoStore>((set, get) => {
	const listsData = loadTodoLists();
	const todos = loadTodos(listsData.currentListId);

	return {
		...createHistoryState(todos),
		currentListId: listsData.currentListId,
		lists: listsData.lists,

		initialize: () => {
			const listsData = loadTodoLists();
			const todos = loadTodos(listsData.currentListId);
			set({
				...createHistoryState(todos),
				currentListId: listsData.currentListId,
				lists: listsData.lists,
			});
		},

		setCurrentList: (listId: string) => {
			const { currentListId } = get();
			// Save current todos before switching
			const { present } = get();
			saveTodos(currentListId, present);

			// Load todos for new list
			const newTodos = loadTodos(listId);
			setCurrentListId(listId);

			set({
				...createHistoryState(newTodos),
				currentListId: listId,
			});
		},

		addList: (name: string) => {
			if (!name.trim()) return;
			const { lists } = get();
			const newList: TodoList = {
				id: crypto.randomUUID(),
				name: name.trim(),
				createdAt: Date.now(),
			};
			const updatedLists = [...lists, newList];
			const listsData = loadTodoLists();
			listsData.lists = updatedLists;
			saveTodoLists(listsData);

			set({ lists: updatedLists });
		},

		renameList: (listId: string, name: string) => {
			if (!name.trim()) return;
			const { lists } = get();
			const updatedLists = lists.map((list) =>
				list.id === listId ? { ...list, name: name.trim() } : list
			);
			const listsData = loadTodoLists();
			listsData.lists = updatedLists;
			saveTodoLists(listsData);

			set({ lists: updatedLists });
		},

		deleteList: (listId: string) => {
			const { lists, currentListId } = get();
			if (lists.length <= 1) return; // Prevent deleting last list

			const updatedLists = lists.filter((list) => list.id !== listId);
			const listsData = loadTodoLists();
			listsData.lists = updatedLists;

			// Switch to first list if deleting current
			if (listId === currentListId) {
				listsData.currentListId = updatedLists[0].id;
				setCurrentListId(updatedLists[0].id);
				const newTodos = loadTodos(updatedLists[0].id);
				set({
					...createHistoryState(newTodos),
					currentListId: updatedLists[0].id,
					lists: updatedLists,
				});
			} else {
				set({ lists: updatedLists });
			}

			// Delete todos for this list
			try {
				localStorage.removeItem(`todos:list:${listId}`);
			} catch {
				// Ignore
			}

			saveTodoLists(listsData);
		},

		addTodo: (title: string, deadline?: string, id?: string, completed?: boolean, priority?: boolean, createdAt?: number) => {
			if (!title.trim()) return;
			const { present, past, currentListId } = get();

			const newTodo: Todo = {
				id: id || crypto.randomUUID(),
				title: title.trim(),
				completed: completed ?? false,
				priority: priority ?? false,
				createdAt: createdAt ?? Date.now(),
				deadline,
			};

			const newTodos = [newTodo, ...present];
			const newPast = [...past, present].slice(-MAX_HISTORY);

			set({
				past: newPast,
				present: newTodos,
				future: [],
			});

			saveTodos(currentListId, newTodos);
		},

		toggleTodo: (id: string) => {
			const { present, past, currentListId } = get();
			const newTodos = present.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo
			);
			const newPast = [...past, present].slice(-MAX_HISTORY);

			set({
				past: newPast,
				present: newTodos,
				future: [],
			});

			saveTodos(currentListId, newTodos);
		},

		deleteTodo: (id: string) => {
			const { present, past, currentListId } = get();
			const newTodos = present.filter((todo) => todo.id !== id);
			const newPast = [...past, present].slice(-MAX_HISTORY);

			set({
				past: newPast,
				present: newTodos,
				future: [],
			});

			saveTodos(currentListId, newTodos);
		},

		editTodo: (id: string, title: string) => {
			if (!title.trim()) return;
			const { present, past, currentListId } = get();
			const newTodos = present.map((todo) =>
				todo.id === id ? { ...todo, title: title.trim() } : todo
			);
			const newPast = [...past, present].slice(-MAX_HISTORY);

			set({
				past: newPast,
				present: newTodos,
				future: [],
			});

			saveTodos(currentListId, newTodos);
		},

		togglePriority: (id: string) => {
			const { present, past, currentListId } = get();
			const newTodos = present.map((todo) =>
				todo.id === id ? { ...todo, priority: !todo.priority } : todo
			);
			const newPast = [...past, present].slice(-MAX_HISTORY);

			set({
				past: newPast,
				present: newTodos,
				future: [],
			});

			saveTodos(currentListId, newTodos);
		},

		setDeadline: (id: string, deadline?: string) => {
			const { present, past, currentListId } = get();
			const newTodos = present.map((todo) =>
				todo.id === id ? { ...todo, deadline } : todo
			);
			const newPast = [...past, present].slice(-MAX_HISTORY);

			set({
				past: newPast,
				present: newTodos,
				future: [],
			});

			saveTodos(currentListId, newTodos);
		},

		undo: () => {
			const { past, present, future, currentListId } = get();
			if (past.length === 0) return;

			const previous = past[past.length - 1];
			const newPast = past.slice(0, -1);

			set({
				past: newPast,
				present: previous,
				future: [present, ...future],
			});

			saveTodos(currentListId, previous);
		},

		redo: () => {
			const { past, present, future, currentListId } = get();
			if (future.length === 0) return;

			const next = future[0];
			const newFuture = future.slice(1);

			set({
				past: [...past, present],
				present: next,
				future: newFuture,
			});

			saveTodos(currentListId, next);
		},

		canUndo: () => get().past.length > 0,
		canRedo: () => get().future.length > 0,
	};
});
