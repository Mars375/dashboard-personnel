import { describe, it, expect, beforeEach, vi } from "vitest";
import { GoogleTasksSyncProvider } from "@/lib/sync/googleTasksSync";
import type { SyncConfig } from "@/lib/sync/apiSync";

// Mock OAuth Manager
vi.mock("@/lib/auth/oauthManager", () => ({
	getOAuthManager: () => ({
		isConnected: vi.fn().mockReturnValue(true),
		getValidAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
	}),
}));

// Mock fetch
global.fetch = vi.fn();

describe("GoogleTasksSyncProvider - Lists Management", () => {
	const validConfig: SyncConfig = {
		provider: "google-tasks",
		enabled: true,
		credentials: {
			token: "oauth",
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		Storage.prototype.getItem = vi.fn();
		Storage.prototype.setItem = vi.fn();
		Storage.prototype.removeItem = vi.fn();
		(global.fetch as any).mockClear();
		localStorage.clear();
	});

	describe("getOrCreateTaskList", () => {
		it("should create a new Google Tasks list if it doesn't exist", async () => {
			const mockAllListsResponse = {
				items: [],
			};

			const mockCreatedList = {
				id: "new-list-id",
				title: "Pro",
			};

			// Mock: getAllTaskLists -> create new list
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockAllListsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreatedList,
				});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const listId = await provider.getOrCreateTaskList("Pro");

			expect(listId).toBe("new-list-id");
			expect(global.fetch).toHaveBeenCalledTimes(2);
			expect(global.fetch).toHaveBeenLastCalledWith(
				"https://www.googleapis.com/tasks/v1/users/@me/lists",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer mock-access-token",
					}),
					body: JSON.stringify({ title: "Pro" }),
				})
			);
		});

		it("should return existing Google Tasks list if it exists", async () => {
			const mockAllListsResponse = {
				items: [
					{ id: "existing-list-id", title: "Pro" },
					{ id: "other-list-id", title: "Perso" },
				],
			};

			// Mock: getAllTaskLists (finds existing list)
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockAllListsResponse,
			});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const listId = await provider.getOrCreateTaskList("Pro");

			expect(listId).toBe("existing-list-id");
			expect(global.fetch).toHaveBeenCalledTimes(1);
			// Should not create a new list
			expect(global.fetch).not.toHaveBeenCalledWith(
				expect.stringContaining("/lists"),
				expect.objectContaining({ method: "POST" })
			);
		});

		it("should reuse cached list ID from localStorage", async () => {
			// Simulate cached mapping
			const mapping = { Pro: "cached-list-id" };
			localStorage.setItem(
				"googleTasks_listMapping",
				JSON.stringify(mapping)
			);

			// Mock localStorage.getItem to return our mapping
			Storage.prototype.getItem = vi.fn((key: string) => {
				if (key === "googleTasks_listMapping") {
					return JSON.stringify(mapping);
				}
				return null;
			});

			// Mock: test list exists (check if list is valid)
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ items: [] }),
			});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const listId = await provider.getOrCreateTaskList("Pro");

			expect(listId).toBe("cached-list-id");
			// Should only call fetch once to test the list
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it("should recreate list if cached ID is invalid (404)", async () => {
			// Simulate cached mapping with invalid ID
			const mapping = { Pro: "invalid-list-id" };
			localStorage.setItem(
				"googleTasks_listMapping",
				JSON.stringify(mapping)
			);

			// Mock localStorage.getItem to return our mapping
			Storage.prototype.getItem = vi.fn((key: string) => {
				if (key === "googleTasks_listMapping") {
					return JSON.stringify(mapping);
				}
				return null;
			});

			const mockAllListsResponse = {
				items: [],
				nextPageToken: undefined,
			};

			const mockCreatedList = {
				id: "new-list-id",
				title: "Pro",
			};

			// Mock: test list (404) -> getAllTaskLists -> create new list
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: "Not Found",
					json: async () => ({}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockAllListsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreatedList,
				});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const listId = await provider.getOrCreateTaskList("Pro");

			expect(listId).toBe("new-list-id");
			// Should have called test (404), getAllTaskLists, and create
			expect(global.fetch).toHaveBeenCalledTimes(3);
		});
	});

	describe("getMissingLocalLists", () => {
		it("should return Google Tasks lists that don't have local correspondance", async () => {
			const mockAllListsResponse = {
				items: [
					{ id: "@default", title: "Mes Tâches" },
					{ id: "list-1", title: "Pro" },
					{ id: "list-2", title: "Perso" },
					{ id: "list-3", title: "Projets" },
					{ id: "list-4", title: "Nouvelle Liste" },
				],
				nextPageToken: undefined,
			};

			// Mock: getAllTaskLists (no pagination)
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockAllListsResponse,
			});

			const provider = new GoogleTasksSyncProvider(validConfig);
			// Local lists: Pro, Perso, Projets
			const missingLists = await provider.getMissingLocalLists([
				"Pro",
				"Perso",
				"Projets",
			]);

			expect(missingLists).toHaveLength(2);
			expect(missingLists).toContainEqual(
				expect.objectContaining({ id: "@default", title: "Mes Tâches" })
			);
			expect(missingLists).toContainEqual(
				expect.objectContaining({ id: "list-4", title: "Nouvelle Liste" })
			);
		});

		it("should return empty array if all Google Tasks lists have local correspondance", async () => {
			const mockAllListsResponse = {
				items: [
					{ id: "list-1", title: "Pro" },
					{ id: "list-2", title: "Perso" },
				],
				nextPageToken: undefined,
			};

			// Mock: getAllTaskLists (no pagination)
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockAllListsResponse,
			});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const missingLists = await provider.getMissingLocalLists(["Pro", "Perso"]);

			expect(missingLists).toHaveLength(0);
		});

		it("should handle @default list correctly", async () => {
			const mockAllListsResponse = {
				items: [
					{ id: "@default", title: "Mes Tâches" },
					{ id: "list-1", title: "Pro" },
				],
				nextPageToken: undefined,
			};

			// Mock: getAllTaskLists (no pagination)
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockAllListsResponse,
			});

			const provider = new GoogleTasksSyncProvider(validConfig);
			// Local lists: Pro, Mes Tâches (should not return @default)
			const missingLists = await provider.getMissingLocalLists(["Pro", "Mes Tâches"]);

			expect(missingLists).toHaveLength(0);
		});
	});

	describe("List mapping persistence", () => {
		it("should save list mapping to localStorage", async () => {
			const mockAllListsResponse = {
				items: [],
				nextPageToken: undefined,
			};

			const mockCreatedList = {
				id: "new-list-id",
				title: "Pro",
			};

			// Mock: getAllTaskLists -> create new list
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockAllListsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreatedList,
				});

			const provider = new GoogleTasksSyncProvider(validConfig);
			await provider.getOrCreateTaskList("Pro");

			// Check that mapping was saved via setItem
			// The mapping should contain Pro -> new-list-id
			const setItemCalls = (localStorage.setItem as any).mock.calls;
			const mappingCall = setItemCalls.find(
				(call: any[]) => call[0] === "googleTasks_listMapping"
			);
			expect(mappingCall).toBeDefined();
			const savedMapping = JSON.parse(mappingCall[1]);
			expect(savedMapping).toHaveProperty("Pro", "new-list-id");
		});

		it("should load list mapping from localStorage", async () => {
			// Pre-populate mapping
			const mapping = {
				Pro: "cached-pro-id",
				Perso: "cached-perso-id",
			};
			localStorage.setItem(
				"googleTasks_listMapping",
				JSON.stringify(mapping)
			);

			// Mock localStorage.getItem to return our mapping
			Storage.prototype.getItem = vi.fn((key: string) => {
				if (key === "googleTasks_listMapping") {
					return JSON.stringify(mapping);
				}
				return null;
			});

			// Mock: test list exists (for both Pro and Perso)
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] }),
				});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const proListId = await provider.getOrCreateTaskList("Pro");
			const persoListId = await provider.getOrCreateTaskList("Perso");

			expect(proListId).toBe("cached-pro-id");
			expect(persoListId).toBe("cached-perso-id");
		});
	});

	describe("pushTodos with list name", () => {
		it("should use correct Google Tasks list when pushing todos", async () => {
			const mockAllListsResponse = {
				items: [{ id: "pro-list-id", title: "Pro" }],
				nextPageToken: undefined,
			};

			const mockCreatedTask = {
				id: "task-1",
				title: "Test todo",
				status: "needsAction",
			};

			// Mock: getOrCreateTaskList -> getAllTaskLists -> pushTodos -> create task
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockAllListsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreatedTask, // Create task response
				});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const todos = [
				{
					id: "local-id-1",
					title: "Test todo",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
			];

			const idMap = await provider.pushTodos(todos, "Pro");
			
			expect(idMap.size).toBe(1);
			expect(idMap.has("local-id-1")).toBe(true);
			expect(idMap.get("local-id-1")).toBe("google-task-1");
			
			// Verify task was created in the correct list
			const createCall = (global.fetch as any).mock.calls.find(
				(call: any[]) => call[0]?.includes("/tasks") && call[1]?.method === "POST"
			);
			expect(createCall).toBeDefined();
			expect(createCall[0]).toContain("pro-list-id");
		});
	});

	describe("pullTodos with list name", () => {
		it("should pull todos from correct Google Tasks list", async () => {
			const mockAllListsResponse = {
				items: [{ id: "perso-list-id", title: "Perso" }],
				nextPageToken: undefined,
			};

			const mockTasksResponse = {
				items: [
					{
						id: "task-1",
						title: "Tâche Perso",
						status: "needsAction",
					},
				],
				nextPageToken: undefined,
			};

			// Mock: getOrCreateTaskList -> getAllTaskLists -> pullTodos
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockAllListsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTasksResponse,
				});

			const provider = new GoogleTasksSyncProvider(validConfig);
			const todos = await provider.pullTodos("Perso");

			expect(todos).toHaveLength(1);
			expect(todos[0].title).toBe("Tâche Perso");
			expect(todos[0].id).toBe("google-task-1");
			
			// Verify tasks were pulled from correct list
			// The fetch calls: getAllTaskLists (/lists), then pullTodos (/lists/{id}/tasks)
			const allCalls = (global.fetch as any).mock.calls;
			const pullCall = allCalls.find(
				(call: any[]) => {
					const url = call[0];
					// Find the call that includes /tasks and the list ID
					return url && typeof url === "string" && url.includes("/tasks") && url.includes("perso-list-id");
				}
			);
			expect(pullCall).toBeDefined();
			expect(pullCall[0]).toContain("perso-list-id");
		});
	});
});

