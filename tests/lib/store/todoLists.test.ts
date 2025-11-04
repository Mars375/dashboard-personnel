import { describe, it, expect, beforeEach } from "vitest";
import { loadTodoLists, saveTodoLists } from "@/store/todoLists";
import type { TodoListsData } from "@/store/todoLists";

describe("todoLists", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("loadTodoLists", () => {
		it("should return default lists when localStorage is empty", () => {
			const data = loadTodoLists();
			
			expect(data.lists).toHaveLength(3);
			expect(data.lists[0].name).toBe("Pro");
			expect(data.lists[1].name).toBe("Perso");
			expect(data.lists[2].name).toBe("Projets");
			expect(data.currentListId).toBe(data.lists[0].id);
		});

		it("should load saved lists from localStorage", () => {
			const savedData: TodoListsData = {
				currentListId: "custom-list-1",
				lists: [
					{ id: "custom-list-1", name: "Custom List 1", createdAt: Date.now() },
					{ id: "custom-list-2", name: "Custom List 2", createdAt: Date.now() },
				],
			};

			localStorage.setItem("todos:lists", JSON.stringify(savedData));
			const loaded = loadTodoLists();

			expect(loaded.lists).toHaveLength(2);
			expect(loaded.currentListId).toBe("custom-list-1");
			expect(loaded.lists[0].name).toBe("Custom List 1");
		});

		it("should use default lists when loaded lists array is empty", () => {
			const invalidData: TodoListsData = {
				currentListId: "invalid",
				lists: [],
			};

			localStorage.setItem("todos:lists", JSON.stringify(invalidData));
			const loaded = loadTodoLists();

			expect(loaded.lists).toHaveLength(3);
			expect(loaded.lists[0].name).toBe("Pro");
		});

		it("should reset currentListId if it doesn't exist in lists", () => {
			const invalidData: TodoListsData = {
				currentListId: "non-existent-id",
				lists: [
					{ id: "list-1", name: "List 1", createdAt: Date.now() },
				],
			};

			localStorage.setItem("todos:lists", JSON.stringify(invalidData));
			const loaded = loadTodoLists();

			expect(loaded.currentListId).toBe("list-1");
		});

		it("should return default data on parse error", () => {
			localStorage.setItem("todos:lists", "invalid json");
			const loaded = loadTodoLists();

			expect(loaded.lists).toHaveLength(3);
			expect(loaded.lists[0].name).toBe("Pro");
		});
	});

	describe("saveTodoLists", () => {
		it("should save lists to localStorage", () => {
			const data: TodoListsData = {
				currentListId: "list-1",
				lists: [
					{ id: "list-1", name: "Test List", createdAt: Date.now() },
				],
			};

			saveTodoLists(data);

			const stored = localStorage.getItem("todos:lists");
			expect(stored).toBeTruthy();
			const parsed = JSON.parse(stored!);
			expect(parsed.currentListId).toBe("list-1");
			expect(parsed.lists).toHaveLength(1);
			expect(parsed.lists[0].name).toBe("Test List");
		});

		it("should handle save errors gracefully", () => {
			// Mock localStorage.setItem to throw
			const originalSetItem = localStorage.setItem;
			localStorage.setItem = () => {
				throw new Error("Storage quota exceeded");
			};

			const data: TodoListsData = {
				currentListId: "list-1",
				lists: [{ id: "list-1", name: "Test", createdAt: Date.now() }],
			};

			// Should not throw
			expect(() => saveTodoLists(data)).not.toThrow();

			// Restore
			localStorage.setItem = originalSetItem;
		});
	});
});

