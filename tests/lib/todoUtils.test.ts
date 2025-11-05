/**
 * Tests pour les utilitaires Todo (Phase 1)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	getCurrentTodos,
	getCurrentLists,
	getTodoById,
	getTodoByTitle,
	waitForListAdded,
	waitForCurrentListChanged,
} from "@/lib/todoUtils";
import { useTodoStore } from "@/store/todoStore";
import type { Todo } from "@/store/todoStorage";
import type { TodoList } from "@/store/todoLists";

// Mock du store
vi.mock("@/store/todoStore", () => ({
	useTodoStore: {
		getState: vi.fn(),
		subscribe: vi.fn(),
	},
}));

describe("todoUtils (Phase 1)", () => {
	const mockTodos: Todo[] = [
		{
			id: "todo-1",
			title: "Tâche 1",
			completed: false,
			priority: false,
			createdAt: Date.now(),
		},
		{
			id: "todo-2",
			title: "Tâche 2",
			completed: true,
			priority: true,
			createdAt: Date.now() - 1000,
		},
		{
			id: "todo-3",
			title: "Tâche 2", // Dupliqué pour tester getTodoByTitle
			completed: false,
			priority: false,
			createdAt: Date.now() - 500,
		},
	];

	const mockLists: TodoList[] = [
		{ id: "list-1", name: "Pro", color: "blue" },
		{ id: "list-2", name: "Perso", color: "green" },
	];

	beforeEach(() => {
		vi.mocked(useTodoStore.getState).mockReturnValue({
			present: mockTodos,
			lists: mockLists,
			currentListId: "list-1",
		} as any);
	});

	describe("getCurrentTodos", () => {
		it("should return current todos from store", () => {
			const todos = getCurrentTodos();

			expect(todos).toEqual(mockTodos);
			expect(useTodoStore.getState).toHaveBeenCalled();
		});
	});

	describe("getCurrentLists", () => {
		it("should return current lists from store", () => {
			const lists = getCurrentLists();

			expect(lists).toEqual(mockLists);
			expect(useTodoStore.getState).toHaveBeenCalled();
		});
	});

	describe("getTodoById", () => {
		it("should return todo by ID", () => {
			const todo = getTodoById("todo-1");

			expect(todo).toEqual(mockTodos[0]);
		});

		it("should return undefined for non-existent ID", () => {
			const todo = getTodoById("non-existent");

			expect(todo).toBeUndefined();
		});
	});

	describe("getTodoByTitle", () => {
		it("should return todo by title (excluding completed)", () => {
			const todo = getTodoByTitle("Tâche 2");

			// Devrait retourner la plus récente non complétée
			expect(todo).toEqual(mockTodos[2]);
		});

		it("should return completed todo when excludeCompleted is false", () => {
			const todo = getTodoByTitle("Tâche 2", false);

			// Devrait retourner la plus récente (y compris complétée)
			expect(todo).toEqual(mockTodos[2]);
		});

		it("should return undefined for non-existent title", () => {
			const todo = getTodoByTitle("Non-existent");

			expect(todo).toBeUndefined();
		});
	});

	describe("waitForListAdded", () => {
		it("should resolve immediately if list exists", async () => {
			const list = await waitForListAdded("Pro", 100);

			expect(list).toEqual(mockLists[0]);
		});

		it("should resolve with undefined on timeout", async () => {
			vi.mocked(useTodoStore.getState).mockReturnValue({
				present: mockTodos,
				lists: [],
				currentListId: "list-1",
			} as any);

			const list = await waitForListAdded("Non-existent", 50);

			expect(list).toBeUndefined();
		});
	});

	describe("waitForCurrentListChanged", () => {
		it("should resolve immediately if list matches", async () => {
			const result = await waitForCurrentListChanged("list-1", 100);

			expect(result).toBe(true);
		});

		it("should resolve with false on timeout", async () => {
			vi.mocked(useTodoStore.getState).mockReturnValue({
				present: mockTodos,
				lists: mockLists,
				currentListId: "list-1",
			} as any);

			const result = await waitForCurrentListChanged("list-2", 50);

			expect(result).toBe(false);
		});
	});
});

