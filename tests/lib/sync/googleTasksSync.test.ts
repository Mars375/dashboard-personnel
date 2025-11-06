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

describe("GoogleTasksSyncProvider", () => {
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
	});

	it("creates provider with correct name and enabled state", () => {
		const provider = new GoogleTasksSyncProvider(validConfig);
		expect(provider.name).toBe("Google Tasks");
		expect(provider.enabled).toBe(true);
	});

	it("returns error when sync called without OAuth", { timeout: 10000 }, async () => {
		const { getOAuthManager } = await import("@/lib/auth/oauthManager");
		const manager = getOAuthManager();
		vi.mocked(manager.isConnected).mockReturnValue(false);
		// Mock getValidAccessToken to throw immediately without retries
		vi.mocked(manager.getValidAccessToken).mockRejectedValue(new Error("Not connected"));

		const config: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
			credentials: {
				token: "oauth",
			},
		};
		const provider = new GoogleTasksSyncProvider(config);
		
		// sync() returns a result object, not throws
		const result = await provider.sync();
		expect(result.success).toBe(false);
		// The error message might vary, so just check it's an error
		expect(result.message).toBeTruthy();
	});

	it("returns success when sync called with valid config", async () => {
		const mockTaskListResponse = {
			items: [{ id: "@default", title: "Mes tâches" }],
		};

		const mockTasksResponse = {
			items: [],
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

		const provider = new GoogleTasksSyncProvider(validConfig);
		const result = await provider.sync();

		expect(result.success).toBe(true);
		expect(result.message).toContain("Synchronisation réussie");
	});

	it("throws error when pushTodos called without OAuth", { timeout: 10000 }, async () => {
		const { getOAuthManager } = await import("@/lib/auth/oauthManager");
		const manager = getOAuthManager();
		vi.mocked(manager.isConnected).mockReturnValue(false);
		vi.mocked(manager.getValidAccessToken).mockRejectedValue(new Error("Not connected"));

		const config: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
			credentials: {
				token: "oauth",
			},
		};
		const provider = new GoogleTasksSyncProvider(config);

		// pushTodos throws when OAuth is not connected
		await expect(provider.pushTodos([], "test-list")).rejects.toThrow();
	});

	it("handles pushTodos with valid credentials", async () => {
		const mockTaskListResponse = {
			items: [{ id: "@default", title: "Mes tâches" }],
		};

		const mockCreatedTask = {
			id: "task-1",
			title: "Test todo",
			status: "needsAction",
		};

		// Mock: getOrCreateDefaultTaskList -> getAllTaskLists -> test @default -> create task
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTaskListResponse,
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [] }), // Test @default response
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

		// Should return ID mapping (don't pass listId, uses @default)
		const idMap = await provider.pushTodos(todos);
		expect(idMap.size).toBe(1);
		expect(idMap.has("local-id-1")).toBe(true);
		expect(idMap.get("local-id-1")).toBe("google-task-1");
	});

	it("handles pullTodos with valid credentials", async () => {
		const mockTaskListResponse = {
			items: [{ id: "@default", title: "Mes tâches" }],
		};

		const mockTasksResponse = {
			items: [],
		};

		// Mock: getOrCreateDefaultTaskList (if listId not provided) -> getAllTaskLists -> test @default -> pull tasks
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTaskListResponse,
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [] }), // Test @default response
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTasksResponse, // Pull tasks response
			});

		const provider = new GoogleTasksSyncProvider(validConfig);
		// Don't pass listId, uses @default
		const result = await provider.pullTodos();

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0);
	});
});
