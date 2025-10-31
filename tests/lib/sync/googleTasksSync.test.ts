import { describe, it, expect, beforeEach } from "vitest";
import { GoogleTasksSyncProvider } from "@/lib/sync/googleTasksSync";
import type { SyncConfig } from "@/lib/sync/apiSync";

describe("GoogleTasksSyncProvider", () => {
	const validConfig: SyncConfig = {
		provider: "google-tasks",
		enabled: true,
		credentials: {
			token: "test-token",
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates provider with correct name and enabled state", () => {
		const provider = new GoogleTasksSyncProvider(validConfig);
		expect(provider.name).toBe("Google Tasks");
		expect(provider.enabled).toBe(true);
	});

	it("returns error when sync called without token", async () => {
		const config: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
		};
		const provider = new GoogleTasksSyncProvider(config);
		const result = await provider.sync();

		expect(result.success).toBe(false);
		expect(result.message).toContain("Configuration Google Tasks incomplète");
		expect(result.error).toContain("Token d'accès");
	});

	it("returns success when sync called with valid config", async () => {
		const provider = new GoogleTasksSyncProvider(validConfig);
		const result = await provider.sync();

		expect(result.success).toBe(true);
		expect(result.message).toContain("Synchronisation Google Tasks réussie");
		expect(result.todosPushed).toBe(0);
		expect(result.todosPulled).toBe(0);
	});

	it("throws error when pushTodos called without token", async () => {
		const config: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
		};
		const provider = new GoogleTasksSyncProvider(config);

		await expect(provider.pushTodos([], "test-list")).rejects.toThrow(
			"Configuration Google Tasks incomplète"
		);
	});

	it("handles pushTodos with valid credentials", async () => {
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
		await expect(provider.pushTodos(todos, "test-list")).resolves.not.toThrow();
	});

	it("throws error when pullTodos called without token", async () => {
		const config: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
		};
		const provider = new GoogleTasksSyncProvider(config);

		await expect(provider.pullTodos("test-list")).rejects.toThrow(
			"Configuration Google Tasks incomplète"
		);
	});

	it("handles pullTodos with valid credentials", async () => {
		const provider = new GoogleTasksSyncProvider(validConfig);
		const result = await provider.pullTodos("test-list");

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0); // Placeholder returns empty array
	});
});

