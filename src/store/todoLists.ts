const STORAGE_KEY = "todos:lists" as const;

export type TodoList = {
	id: string;
	name: string;
	createdAt: number;
};

export type TodoListsData = {
	currentListId: string;
	lists: TodoList[];
};

const DEFAULT_LISTS: TodoList[] = [
	{ id: "pro", name: "Pro", createdAt: Date.now() },
	{ id: "perso", name: "Perso", createdAt: Date.now() },
	{ id: "projets", name: "Projets", createdAt: Date.now() },
];

export function loadTodoLists(): TodoListsData {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			// Initialize with default lists
			const data: TodoListsData = {
				currentListId: DEFAULT_LISTS[0].id,
				lists: DEFAULT_LISTS,
			};
			saveTodoLists(data);
			return data;
		}
		const parsed = JSON.parse(stored) as TodoListsData;
		// Ensure at least one list exists
		if (parsed.lists.length === 0) {
			parsed.lists = DEFAULT_LISTS;
		}
		// Ensure currentListId exists
		if (!parsed.lists.find((l) => l.id === parsed.currentListId)) {
			parsed.currentListId = parsed.lists[0].id;
		}
		return parsed;
	} catch {
		return {
			currentListId: DEFAULT_LISTS[0].id,
			lists: DEFAULT_LISTS,
		};
	}
}

export function saveTodoLists(data: TodoListsData): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// Ignore errors
	}
}

export function setCurrentListId(listId: string): void {
	const data = loadTodoLists();
	data.currentListId = listId;
	saveTodoLists(data);
}

