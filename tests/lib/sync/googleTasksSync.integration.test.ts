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
		
		// Mock localStorage - ensure it returns null/undefined to avoid cached state
		Storage.prototype.getItem = vi.fn().mockReturnValue(null);
		Storage.prototype.setItem = vi.fn();
		Storage.prototype.removeItem = vi.fn();
		
		// Reset fetch mock completely before each test
		(global.fetch as any).mockReset();
		(global.fetch as any).mockClear();
		
		provider = new GoogleTasksSyncProvider(validConfig);
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

			// getAllTaskLists finds "Mes tâches", returns "@default" early, then tests @default
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockListsResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({ items: [] }), // Test @default access (not actually called since we return early)
				});

			const taskListId = await (provider as any).getOrCreateDefaultTaskList();
			expect(taskListId).toBe("@default");
		});

		it("should create new list if @default not found", async () => {
			const mockListsResponse = {
				items: [],
				nextPageToken: undefined,
			};

			const mockCreateResponse = {
				id: "new-list-id",
				title: "Dashboard Personnel",
			};

			// getAllTaskLists returns empty, so tests @default access
			// If @default is not accessible, it does a recheck (getAllTaskLists again), then creates new list
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockListsResponse), // getAllTaskLists - empty (first call)
				})
				.mockResolvedValueOnce({
					ok: false, // @default not accessible
					status: 404,
					json: vi.fn().mockResolvedValue({ error: { message: "Not found" } }), // Test @default access fails
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({ items: [], nextPageToken: undefined }), // Recheck getAllTaskLists (after 500ms delay)
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockCreateResponse), // Create new list
				});

			const taskListId = await (provider as any).getOrCreateDefaultTaskList();
			expect(taskListId).toBe("new-list-id");
			// Note: The code assigns this.taskListId but doesn't call saveTaskListId for new lists
			// So we just verify the returned ID is correct
		});

		it("should handle 404 error and retry", async () => {
			const mockListsResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			// Configure the mock BEFORE creating the provider so the constructor reads it
			Storage.prototype.getItem = vi.fn((key: string) => {
				if (key === "googleTasks_taskListId") {
					return "invalid-id";
				}
				return null;
			});

			// Create a new provider instance for this test to avoid cached state
			const testProvider = new GoogleTasksSyncProvider(validConfig);

			// Sequence:
			// 1. getOrCreateDefaultTaskList() tests invalid-id -> 404
			// 2. getOrCreateDefaultTaskList() calls getAllTaskLists() -> finds "Mes tâches"
			// 3. getOrCreateDefaultTaskList() tests @default access -> success
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: "Not Found",
					json: vi.fn().mockResolvedValue({ error: { message: "Not found" } }),
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue(mockListsResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue({ items: [] }), // test @default access
				});

			const taskListId = await (testProvider as any).getOrCreateDefaultTaskList();
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
				nextPageToken: undefined,
			};

			const mockCreatedTask = {
				id: "task-id-456", // Google returns ID without "google-" prefix
				title: "Test Task",
				status: "needsAction",
			};

			// getOrCreateDefaultTaskList: getAllTaskLists finds "Mes tâches", then tests @default access
			// pushTodos: creates task
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({}), // test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockCreatedTask), // pushTodos creates task
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.has("local-id-123")).toBe(true);
			expect(idMap.get("local-id-123")).toBe("google-task-id-456"); // Code adds "google-" prefix
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
				nextPageToken: undefined,
			};

			const mockUpdatedTask = {
				id: "task-id-456",
				title: "Updated Task",
				status: "completed",
			};

			// getOrCreateDefaultTaskList: getAllTaskLists finds "Mes tâches", then tests @default access
			// pushTodos: updates task
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({}), // test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockUpdatedTask), // pushTodos updates task
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.size).toBe(0); // No new IDs for updates
			// Verify PATCH was called
			const patchCalls = (global.fetch as any).mock.calls.filter(
				(call: any[]) => call[1]?.method === "PATCH"
			);
			expect(patchCalls.length).toBeGreaterThan(0);
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
				nextPageToken: undefined,
			};

			const mockCreatedTask = {
				id: "task-id-456", // Google returns ID without "google-" prefix
				title: "Test Task",
				status: "needsAction",
			};

			// getOrCreateDefaultTaskList: getAllTaskLists finds "Mes tâches", then tests @default access
			// pushTodos: create task fails and retries
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({}), // test @default access
				})
				.mockRejectedValueOnce(new Error("network error")) // First create attempt fails
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockCreatedTask), // Retry succeeds
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.has("local-id-123")).toBe(true);
		});
	});

	describe("pullTodos", () => {
		it("should pull todos and convert them correctly", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockTasksResponse = {
				items: [
					{
						id: "task-1",
						title: "Task 1",
						status: "needsAction",
						due: "2024-12-31T00:00:00.000Z",
					},
					{
						id: "task-2",
						title: "Task 2",
						status: "completed",
						due: "2024-12-30T00:00:00.000Z",
					},
				],
				nextPageToken: undefined,
			};

			// getOrCreateDefaultTaskList: getAllTaskLists finds "Mes tâches", then tests @default access
			// pullTodos: gets tasks
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({}), // test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTasksResponse), // pullTodos
				});

			const todos = await provider.pullTodos();

			expect(todos.length).toBe(2);
			expect(todos[0].id).toBe("google-task-1");
			expect(todos[0].title).toBe("Task 1");
			expect(todos[0].completed).toBe(false);
			expect(todos[0].deadline).toBe("2024-12-31");
			expect(todos[1].id).toBe("google-task-2");
			expect(todos[1].completed).toBe(true);
		});

		it("should handle pagination", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockTasksResponse1 = {
				items: [{ id: "task-1", title: "Task 1", status: "needsAction" }],
				nextPageToken: "page-2",
			};

			const mockTasksResponse2 = {
				items: [{ id: "task-2", title: "Task 2", status: "needsAction" }],
				nextPageToken: undefined,
			};

			// getOrCreateDefaultTaskList: getAllTaskLists finds "Mes tâches", then tests @default access
			// pullTodos with pagination
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({}), // test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTasksResponse1), // pullTodos page 1
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTasksResponse2), // pullTodos page 2
				});

			const todos = await provider.pullTodos();

			expect(todos.length).toBe(2);
		});

		it("should handle 404 and retry with new list", async () => {
			// Configure the mock BEFORE creating the provider so the constructor reads it
			Storage.prototype.getItem = vi.fn((key: string) => {
				if (key === "googleTasks_taskListId") {
					return "invalid-list-id";
				}
				return null;
			});

			// Create a new provider instance to test the 404 retry logic
			const testProvider = new GoogleTasksSyncProvider(validConfig);

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockTasksResponse = {
				items: [],
				nextPageToken: undefined,
			};

			// Sequence:
			// 1. pullTodos() calls getOrCreateDefaultTaskList()
			// 2. getOrCreateDefaultTaskList() tests invalid-list-id -> 404
			// 3. getOrCreateDefaultTaskList() calls getAllTaskLists() -> finds "Mes tâches"
			// 4. getOrCreateDefaultTaskList() tests @default access -> success
			// 5. pullTodos() tries to fetch tasks with "@default" -> 404 (list doesn't exist in this test scenario)
			// 6. pullTodos() calls getOrCreateDefaultTaskList() again (but taskListId is now null, so no initial test)
			// 7. getOrCreateDefaultTaskList() calls getAllTaskLists() -> finds "Mes tâches"
			// 8. getOrCreateDefaultTaskList() tests @default access -> success
			// 9. pullTodos() calls itself recursively with newTaskListId ("@default") as localListName
			// 10. In recursive call, pullTodos calls getOrCreateTaskList("@default") which calls getOrCreateDefaultTaskList()
			// 11. getOrCreateDefaultTaskList() calls getAllTaskLists() -> finds "Mes tâches"
			// 12. getOrCreateDefaultTaskList() tests @default access -> success
			// 13. pullTodos() tries to fetch tasks with "@default" -> success
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: "Not Found",
					json: vi.fn().mockResolvedValue({ error: { message: "Not found" } }), // Test invalid-list-id
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue({ items: [] }), // test @default access
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: "Not Found",
					json: vi.fn().mockResolvedValue({ error: { message: "Not found" } }), // pullTodos with @default -> 404
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists again - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue({ items: [] }), // test @default access again
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists in recursive call
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue({ items: [] }), // test @default access in recursive call
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					statusText: "OK",
					json: vi.fn().mockResolvedValue(mockTasksResponse), // pullTodos recursive call succeeds
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
				nextPageToken: undefined,
			};

			// getOrCreateDefaultTaskList: getAllTaskLists finds "Mes tâches", then tests @default access
			// deleteTask: deletes task
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({}), // test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: vi.fn().mockResolvedValue({}), // DELETE response (may be called if response.ok is checked)
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
				nextPageToken: undefined,
			};

			// getOrCreateDefaultTaskList: getAllTaskLists finds "Mes tâches", then tests @default access
			// deleteTask: delete returns 404
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue(mockTaskListResponse), // getAllTaskLists - finds "Mes tâches"
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValue({}), // test @default access
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					json: vi.fn().mockResolvedValue({}), // DELETE 404 response (may be called if response.ok is checked)
				});

			await expect(provider.deleteTask("google-task-id-123")).resolves.not.toThrow();
		});
	});
});

