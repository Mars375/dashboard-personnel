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

	it("returns error when sync called without OAuth", async () => {
		const { getOAuthManager } = await import("@/lib/auth/oauthManager");
		const manager = getOAuthManager();
		vi.mocked(manager.isConnected).mockReturnValueOnce(false);

		const config: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
			credentials: {
				token: "oauth",
			},
		};
		const provider = new GoogleTasksSyncProvider(config);
		
		await expect(provider.sync()).rejects.toThrow("Non connecté à Google");
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

	it("throws error when pushTodos called without OAuth", async () => {
		const { getOAuthManager } = await import("@/lib/auth/oauthManager");
		const manager = getOAuthManager();
		vi.mocked(manager.isConnected).mockReturnValueOnce(false);

		const config: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
			credentials: {
				token: "oauth",
			},
		};
		const provider = new GoogleTasksSyncProvider(config);

		await expect(provider.pushTodos([], "test-list")).rejects.toThrow(
			"Non connecté à Google"
		);
	});

	it("handles pushTodos with valid credentials", async () => {
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
				json: async () => ({ id: "task-1", title: "Test todo" }),
			});

		const provider = new GoogleTasksSyncProvider(validConfig);
		const todos = [
			{
				id: "1",
				title: "Test todo",
				completed: false,
				priority: false,
				createdAt: Date.now(),
			},
		];

		// Should not throw
		const idMap = await provider.pushTodos(todos, "test-list");
		expect(idMap.size).toBeGreaterThan(0);
	});

	it("handles pullTodos with valid credentials", async () => {
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
		const result = await provider.pullTodos("test-list");

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0);
	});
});
