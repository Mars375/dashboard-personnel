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

describe("GoogleTasksSyncProvider - Bidirectional Sync", () => {
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

	describe("Full sync cycle", () => {
		it("should sync new local task to Google Tasks and back", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			// Create local task
			const localTodo: Todo = {
				id: "local-id-123",
				title: "New Local Task",
				completed: false,
				priority: false,
				createdAt: Date.now(),
			};

			const mockCreatedTask = {
				id: "task-456", // Google returns ID without "google-" prefix
				title: "New Local Task",
				status: "needsAction",
			};

			// Push: create task in Google
			// Note: getAllTaskLists -> test @default -> POST create task
			// The response.json() can only be called once, so we need to create a new response object
			const createTaskResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockCreatedTask),
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
				.mockResolvedValueOnce(createTaskResponse);

			const idMap = await provider.pushTodos([localTodo]);
			expect(idMap.size).toBe(1);
			expect(idMap.get("local-id-123")).toBe("google-task-456"); // Code adds "google-" prefix

			// Pull: retrieve task from Google
			// Note: Google returns ID without "google-" prefix, pullTodos adds "google-" prefix
			const mockTasksResponse = {
				items: [
					{
						id: "task-456", // Google returns ID without prefix
						title: "New Local Task",
						status: "needsAction",
					},
				],
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

			const pulledTodos = await provider.pullTodos();
			expect(pulledTodos.length).toBe(1);
			// The ID will be "google-task-456" because pullTodos adds "google-" prefix to Google IDs
			expect(pulledTodos[0].id).toBe("google-task-456");
			expect(pulledTodos[0].title).toBe("New Local Task");
		});

		it("should sync task updated in Google Tasks back to local", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			// Initial task in Google (ID without "google-" prefix)
			const initialTask = {
				id: "task-789", // Google returns ID without "google-" prefix
				title: "Original Task",
				status: "needsAction",
			};

			// Pull initial task
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
					json: async () => ({ items: [initialTask], nextPageToken: undefined }),
				});

			const initialTodos = await provider.pullTodos();
			expect(initialTodos.length).toBeGreaterThan(0);
			expect(initialTodos[0].title).toBe("Original Task");
			expect(initialTodos[0].id).toBe("google-task-789"); // pullTodos adds "google-" prefix

			// Task updated in Google (simulate external update)
			const updatedTask = {
				id: "task-789", // Google returns ID without "google-" prefix
				title: "Updated Task",
				status: "completed",
			};

			// Pull updated task
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
					json: async () => ({ items: [updatedTask], nextPageToken: undefined }),
				});

			const updatedTodos = await provider.pullTodos();
			expect(updatedTodos[0].title).toBe("Updated Task");
			expect(updatedTodos[0].completed).toBe(true);
		});

		it("should handle task deleted in Google Tasks", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			// Task exists initially
			const existingTask = {
				id: "task-999", // Google returns ID without "google-" prefix
				title: "Task to Delete",
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
					json: async () => ({ items: [existingTask], nextPageToken: undefined }),
				});

			const todosBefore = await provider.pullTodos();
			expect(todosBefore.length).toBe(1);

			// Task deleted in Google (empty response)
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
					json: async () => ({ items: [], nextPageToken: undefined }), // Task no longer exists
				});

			const todosAfter = await provider.pullTodos();
			expect(todosAfter.length).toBe(0);
		});
	});

	describe("Conflict resolution", () => {
		it("should handle task modified in both local and Google", async () => {
			const mockTaskListResponse = {
				items: [{ id: "@default", title: "Mes tâches" }],
				nextPageToken: undefined,
			};

			// Local modification
			const localTodo: Todo = {
				id: "google-task-conflict",
				title: "Local Change",
				completed: false,
				priority: true,
				createdAt: Date.now(),
			};

			// Google has different version
			const googleTask = {
				id: "google-task-conflict",
				title: "Google Change",
				status: "completed",
			};

			// Push local changes
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
					json: async () => googleTask, // Update successful
				});

			const idMap = await provider.pushTodos([localTodo]);
			expect(idMap.size).toBe(0); // No new ID, just update

			// Pull Google version (should overwrite local)
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
					json: async () => ({ items: [googleTask], nextPageToken: undefined }),
				});

			const pulledTodos = await provider.pullTodos();
			expect(pulledTodos.length).toBeGreaterThan(0);
			expect(pulledTodos[0].title).toBe("Google Change");
			expect(pulledTodos[0].completed).toBe(true);
		});
	});
});



