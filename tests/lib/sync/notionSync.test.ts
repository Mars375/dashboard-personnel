import { describe, it, expect, beforeEach } from "vitest";
import { NotionSyncProvider } from "@/lib/sync/notionSync";
import type { SyncConfig } from "@/lib/sync/apiSync";

describe("NotionSyncProvider", () => {
	const validConfig: SyncConfig = {
		provider: "notion",
		enabled: true,
		credentials: {
			apiKey: "test-api-key",
			databaseId: "test-database-id",
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates provider with correct name and enabled state", () => {
		const provider = new NotionSyncProvider(validConfig);
		expect(provider.name).toBe("Notion");
		expect(provider.enabled).toBe(true);
	});

	it("returns error when sync called without apiKey", async () => {
		const config: SyncConfig = {
			provider: "notion",
			enabled: true,
			credentials: {
				databaseId: "test-db",
			},
		};
		const provider = new NotionSyncProvider(config);
		const result = await provider.sync();

		expect(result.success).toBe(false);
		expect(result.message).toContain("Configuration Notion incomplète");
		expect(result.error).toContain("API key");
	});

	it("returns error when sync called without databaseId", async () => {
		const config: SyncConfig = {
			provider: "notion",
			enabled: true,
			credentials: {
				apiKey: "test-key",
			},
		};
		const provider = new NotionSyncProvider(config);
		const result = await provider.sync();

		expect(result.success).toBe(false);
		expect(result.message).toContain("Configuration Notion incomplète");
		expect(result.error).toContain("Database ID");
	});

	it("returns success when sync called with valid config", async () => {
		const provider = new NotionSyncProvider(validConfig);
		const result = await provider.sync();

		expect(result.success).toBe(true);
		expect(result.message).toContain("Synchronisation Notion réussie");
		expect(result.todosPushed).toBe(0);
		expect(result.todosPulled).toBe(0);
	});

	it("throws error when pushTodos called without credentials", async () => {
		const config: SyncConfig = {
			provider: "notion",
			enabled: true,
		};
		const provider = new NotionSyncProvider(config);

		await expect(provider.pushTodos([], "test-list")).rejects.toThrow(
			"Configuration Notion incomplète"
		);
	});

	it("handles pushTodos with valid credentials", async () => {
		const provider = new NotionSyncProvider(validConfig);
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

	it("throws error when pullTodos called without credentials", async () => {
		const config: SyncConfig = {
			provider: "notion",
			enabled: true,
		};
		const provider = new NotionSyncProvider(config);

		await expect(provider.pullTodos("test-list")).rejects.toThrow(
			"Configuration Notion incomplète"
		);
	});

	it("handles pullTodos with valid credentials", async () => {
		const provider = new NotionSyncProvider(validConfig);
		const result = await provider.pullTodos("test-list");

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0); // Placeholder returns empty array
	});
});

