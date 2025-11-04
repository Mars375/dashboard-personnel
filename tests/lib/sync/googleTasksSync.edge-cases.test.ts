import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GoogleTasksSyncProvider } from "@/lib/sync/googleTasksSync";
import type { SyncConfig } from "@/lib/sync/apiSync";
import type { Todo } from "@/store/todoStorage";

// Mock OAuth Manager
const mockOAuthManager = {
	isConnected: vi.fn().mockReturnValue(true),
	getValidAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
};

vi.mock("@/lib/auth/oauthManager", () => ({
	getOAuthManager: () => mockOAuthManager,
}));

// Mock fetch
global.fetch = vi.fn();

describe("GoogleTasksSyncProvider - Edge Cases", () => {
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
		mockOAuthManager.isConnected.mockReturnValue(true);
		mockOAuthManager.getValidAccessToken.mockResolvedValue("mock-access-token");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Network errors and retries", () => {
		it("should retry on network timeout", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			// First call (getAllTaskLists) fails with timeout, second succeeds
			(global.fetch as any)
				.mockRejectedValueOnce(new Error("Network timeout"))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				});

			const taskListId = await (provider as any).getOrCreateDefaultTaskList();
			expect(taskListId).toBe("@default");
		});

		it("should handle rate limiting (429)", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			// First call returns 429, second succeeds
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: false,
					status: 429,
					statusText: "Too Many Requests",
					json: async () => ({}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTaskListResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				});

			// Should retry and eventually succeed
			const taskListId = await (provider as any).getOrCreateDefaultTaskList();
			expect(taskListId).toBe("@default");
		});

		it("should handle empty task list", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockTasksResponse = {
				items: [],
				nextPageToken: undefined,
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
			expect(todos).toEqual([]);
		});
	});

	describe("Task validation", () => {
		it("should handle task with empty title", async () => {
			const todo: Todo = {
				id: "local-id-123",
				title: "", // Empty title
				completed: false,
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
				});

			// Should handle empty title gracefully (provider should skip or use default)
			const idMap = await provider.pushTodos([todo]);
			// The provider should either skip empty titles or use a default
			expect(idMap).toBeDefined();
		});

		it("should handle task with very long title", async () => {
			const longTitle = "A".repeat(1000);
			const todo: Todo = {
				id: "local-id-123",
				title: longTitle,
				completed: false,
				priority: false,
				createdAt: Date.now(),
			};

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockCreatedTask = {
				id: "google-task-id-456",
				title: longTitle.substring(0, 1024), // Google Tasks limit
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
			expect(idMap.size).toBeGreaterThan(0);
			expect(idMap.has("local-id-123")).toBe(true);
		});
	});

	describe("Date handling", () => {
		it("should handle task with invalid deadline format", async () => {
			const todo: Todo = {
				id: "local-id-123",
				title: "Task with deadline",
				deadline: "invalid-date", // Invalid format
				completed: false,
				priority: false,
				createdAt: Date.now(),
			};

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
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
					json: async () => ({ id: "task-1", title: "Task with deadline", status: "needsAction" }),
				});

			// Should handle invalid date gracefully
			const idMap = await provider.pushTodos([todo]);
			expect(idMap).toBeDefined();
		});

		it("should handle task with deadline in past", async () => {
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 10);
			const todo: Todo = {
				id: "local-id-123",
				title: "Task with past deadline",
				deadline: pastDate.toISOString().split("T")[0],
				completed: false,
				priority: false,
				createdAt: Date.now(),
			};

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			const mockCreatedTask = {
				id: "task-1",
				title: "Task with past deadline",
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
			expect(idMap.size).toBeGreaterThan(0);
			expect(idMap.has("local-id-123")).toBe(true);
		});
	});

	describe("Concurrent operations", () => {
		it("should handle multiple simultaneous push operations", async () => {
			const todos: Todo[] = [
				{
					id: "local-id-1",
					title: "Task 1",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
				{
					id: "local-id-2",
					title: "Task 2",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
			];

			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
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
					json: async () => ({ id: "task-1", title: "Task 1", status: "needsAction" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: "task-2", title: "Task 2", status: "needsAction" }),
				});

			const idMap = await provider.pushTodos(todos);
			expect(idMap.size).toBe(2);
			expect(idMap.has("local-id-1")).toBe(true);
			expect(idMap.has("local-id-2")).toBe(true);
		});
	});
});



