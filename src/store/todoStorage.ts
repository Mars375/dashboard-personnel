const STORAGE_PREFIX = "todos:list:" as const;

export type Todo = {
	id: string;
	title: string;
	completed: boolean;
	priority: boolean;
	createdAt: number;
	deadline?: string; // ISO date string (YYYY-MM-DD)
};

export function loadTodos(listId: string): Todo[] {
	try {
		const stored = localStorage.getItem(`${STORAGE_PREFIX}${listId}`);
		if (!stored) return [];
		return JSON.parse(stored) as Todo[];
	} catch {
		return [];
	}
}

export function saveTodos(listId: string, todos: Todo[]): void {
	try {
		localStorage.setItem(`${STORAGE_PREFIX}${listId}`, JSON.stringify(todos));
	} catch {
		// Ignore errors (quota exceeded, etc.)
	}
}
