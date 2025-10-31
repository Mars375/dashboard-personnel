import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadTodos, saveTodos, type Todo } from "@/store/todoStorage";

describe("todoStorage (smoke)", () => {
	beforeEach(() => {
		// Mock localStorage
		const store: Record<string, string> = {};
		vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
			store[key] = value;
		});
		vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
			return store[key] ?? null;
		});
		vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
			delete store[key];
		});
		vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {
			Object.keys(store).forEach((key) => delete store[key]);
		});
	});

	it("saves and loads todos", () => {
		const todos: Todo[] = [
			{
				id: "1",
				title: "Test task",
				completed: false,
				priority: false,
				createdAt: Date.now(),
			},
		];
		saveTodos("test-list", todos);
		expect(loadTodos("test-list")).toEqual(todos);
	});

	it("returns empty array when no todos saved", () => {
		expect(loadTodos("non-existent")).toEqual([]);
	});

	it("handles localStorage errors gracefully", () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("QuotaExceededError");
		});
		expect(() => saveTodos("test-list", [])).not.toThrow();

		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("SecurityError");
		});
		expect(loadTodos("test-list")).toEqual([]);
	});
});

