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

describe("GoogleTasksSyncProvider - Duplicate Prevention", () => {
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

	describe("pullTodos - duplicate prevention", () => {
		it("should not add duplicate tasks when pulling multiple times", async () => {
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
					},
				],
				nextPageToken: undefined,
			};

			// First pull: getAllTaskLists -> test @default (fetch) -> pullTodos
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }), // Test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse,
				});

			const todos1 = await provider.pullTodos();
			expect(todos1.length).toBe(1);
			expect(todos1[0].id).toBe("google-task-1");

			// Second pull - same task should not create duplicates
			// Note: taskListId is cached from first call, so we only need:
			// 1. Test if cached list is still valid (fetch @default/tasks?maxResults=1)
			// 2. pullTodos (fetch @default/tasks?...)
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }), // Test cached list validity
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse, // pullTodos
				});

			const todos2 = await provider.pullTodos();
			// Should still return the same task (not filtered here, but the widget should handle it)
			expect(todos2.length).toBe(1);
			expect(todos2[0].id).toBe("google-task-1");
		});

		it("should handle tasks with same ID but different content", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockTasksResponse1 = {
				items: [
					{
						id: "task-1",
						title: "Task 1",
						status: "needsAction",
					},
				],
				nextPageToken: undefined,
			};

			const mockTasksResponse2 = {
				items: [
					{
						id: "task-1",
						title: "Task 1 Updated",
						status: "completed",
					},
				],
				nextPageToken: undefined,
			};

			// First pull: getAllTaskLists -> test @default (fetch) -> pullTodos
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }), // Test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse1,
				});

			const todos1 = await provider.pullTodos();
			expect(todos1.length).toBeGreaterThan(0);
			expect(todos1[0].title).toBe("Task 1");
			expect(todos1[0].completed).toBe(false);

			// Second pull with updated content: getAllTaskLists -> test @default (fetch) -> pullTodos
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }), // Test @default access
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse2,
				});

			const todos2 = await provider.pullTodos();
			expect(todos2.length).toBeGreaterThan(0);
			expect(todos2[0].title).toBe("Task 1 Updated");
			expect(todos2[0].completed).toBe(true);
		});
	});

	describe("pushTodos - ID mapping", () => {
		it("should return correct ID mapping for new tasks", async () => {
			const todo: Todo = {
				id: "local-id-123",
				title: "New Task",
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
				title: "New Task",
				status: "needsAction",
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
					json: async () => mockCreatedTask,
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.has("local-id-123")).toBe(true);
			expect(idMap.get("local-id-123")).toBe("google-task-id-456"); // Code adds "google-" prefix
		});

		it("should not return ID mapping for tasks that already have Google ID", async () => {
			const todo: Todo = {
				id: "google-task-id-456",
				title: "Existing Task",
				completed: false,
				priority: false,
				createdAt: Date.now(),
			};

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockUpdatedTask = {
				id: "task-id-456",
				title: "Existing Task",
				status: "needsAction",
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
					json: async () => mockUpdatedTask,
				});

			const idMap = await provider.pushTodos([todo]);

			expect(idMap.size).toBe(0); // No new IDs for updates
		});
	});
});



