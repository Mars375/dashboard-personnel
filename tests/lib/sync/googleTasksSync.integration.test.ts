import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GoogleTasksSyncProvider } from "@/lib/sync/googleTasksSync";
import type { SyncConfig } from "@/lib/sync/apiSync";
import type { Todo } from "@/store/todoStorage";

// Mock OAuth Manager
vi.mock("@/lib/auth/oauthManager", () => ({
	getOAuthManager: () => ({
		isConnected: vi.fn().mockReturnValue(true),
		getValidAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
	}),
}));

// Mock fetch
global.fetch = vi.fn();

describe("GoogleTasksSyncProvider - Integration Tests", () => {
	const validConfig: SyncConfig = {
		provider: "google-tasks",
		enabled: true,
		credentials: {
			token: "oauth",
		},
	};

	let provider: GoogleTasksSyncProvider;

	beforeEach(() => {
		vi.clearAllMocks();
		provider = new GoogleTasksSyncProvider(validConfig);
		
		// Mock localStorage
		Storage.prototype.getItem = vi.fn();
		Storage.prototype.setItem = vi.fn();
		Storage.prototype.removeItem = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getOrCreateDefaultTaskList", () => {
		it("should find and use @default task list", async () => {
			const mockListsResponse = {
				items: [
					{ id: "@default", title: "Mes tâches" },
				],
			};

			// Mock getAllTaskLists call
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockListsResponse,
				})
				// Mock test call for @default
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				});

			const taskListId = await (provider as any).getOrCreateDefaultTaskList();
			expect(taskListId).toBe("@default");
		});

		it("should create new list if @default not found", async () => {
			const mockListsResponse = {
				items: [],
			};

			const mockCreateResponse = {
				id: "new-list-id",
				title: "Dashboard Personnel",
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockListsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreateResponse,
				});

			const taskListId = await (provider as any).getOrCreateDefaultTaskList();
			expect(taskListId).toBe("new-list-id");
			expect(Storage.prototype.setItem).toHaveBeenCalledWith(
				"googleTasks_taskListId",
				"new-list-id"
			);
		});

		it("should handle 404 error and retry", async () => {
			const mockListsResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			Storage.prototype.getItem = vi.fn().mockReturnValue("invalid-id");

			// First call (test invalid list) returns 404, then getAllTaskLists succeeds
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockListsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				});

			const taskListId = await (provider as any).getOrCreateDefaultTaskList();
			expect(taskListId).toBe("@default");
		});
	});

	describe("pushTodos", () => {
		it("should create new task and return ID mapping", async () => {
			const todo: Todo = {
				id: "local-id-123",
				title: "Test Task",
				completed: false,
				priority: false,
				createdAt: Date.now(),
				deadline: "2024-12-31",
			};

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			const mockCreatedTask = {
				id: "google-task-id-456",
				title: "Test Task",
				status: "needsAction",
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreatedTask,
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.has("local-id-123")).toBe(true);
			expect(idMap.get("local-id-123")).toBe("google-google-task-id-456");
		});

		it("should update existing task with Google ID", async () => {
			const todo: Todo = {
				id: "google-task-id-456",
				title: "Updated Task",
				completed: true,
				priority: false,
				createdAt: Date.now(),
			};

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.size).toBe(0); // No new IDs for updates
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/tasks/task-id-456"),
				expect.objectContaining({
					method: "PATCH",
				})
			);
		});

		it("should handle retry on network error", async () => {
			const todo: Todo = {
				id: "local-id-123",
				title: "Test Task",
				completed: false,
				priority: false,
				createdAt: Date.now(),
			};

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			const mockCreatedTask = {
				id: "google-task-id-456",
				title: "Test Task",
			};

			// First call fails, second succeeds
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				})
				.mockRejectedValueOnce(new Error("network error"))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreatedTask,
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.has("local-id-123")).toBe(true);
		});
	});

	describe("pullTodos", () => {
		it("should pull todos and convert them correctly", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			const mockTasksResponse = {
				items: [
					{
						id: "task-1",
						title: "Task 1",
						status: "needsAction",
						due: "2024-12-31",
					},
					{
						id: "task-2",
						title: "Task 2",
						status: "completed",
						due: "2024-12-30",
					},
				],
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse,
				});

			const todos = await provider.pullTodos();

			expect(todos.length).toBe(2);
			expect(todos[0].id).toBe("google-task-1");
			expect(todos[0].title).toBe("Task 1");
			expect(todos[0].completed).toBe(false);
			expect(todos[0].deadline).toBe("2024-12-31");
			expect(todos[1].completed).toBe(true);
		});

		it("should handle pagination", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			const mockTasksResponse1 = {
				items: [{ id: "task-1", title: "Task 1", status: "needsAction" }],
				nextPageToken: "page-2",
			};

			const mockTasksResponse2 = {
				items: [{ id: "task-2", title: "Task 2", status: "needsAction" }],
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse1,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse2,
				});

			const todos = await provider.pullTodos();

			expect(todos.length).toBe(2);
		});

		it("should handle 404 and retry with new list", async () => {
			// Create a new provider instance to test the 404 retry logic
			const testProvider = new GoogleTasksSyncProvider(validConfig);
			Storage.prototype.getItem = vi.fn().mockReturnValue("invalid-list-id");

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			const mockTasksResponse = {
				items: [],
			};

			// First pull returns 404, then getAllTaskLists, then test @default, then retry pull succeeds
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					json: async () => ({ error: { message: "Not found" } }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse,
				});

			const todos = await testProvider.pullTodos();

			expect(todos).toEqual([]);
			expect(Storage.prototype.removeItem).toHaveBeenCalledWith("googleTasks_taskListId");
		});
	});

	describe("deleteTask", () => {
		it("should delete task with Google ID", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
				});

			await provider.deleteTask("google-task-id-123");

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/tasks/task-id-123"),
				expect.objectContaining({
					method: "DELETE",
				})
			);
		});

		it("should handle 404 gracefully (task already deleted)", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
				});

			await expect(provider.deleteTask("google-task-id-123")).resolves.not.toThrow();
		});
	});
});

