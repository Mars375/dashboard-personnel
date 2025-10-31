import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncManager } from "@/lib/sync/syncManager";
import { saveSyncConfig } from "@/lib/sync/apiSync";
import type { SyncConfig } from "@/lib/sync/apiSync";

describe("SyncManager", () => {
	let syncManager: SyncManager;

	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		syncManager = new SyncManager();
	});

	it("initializes with no providers when localStorage is empty", () => {
		const providers = syncManager.getAllProviders();
		expect(providers).toEqual([]);
	});

	it("loads providers from localStorage on initialization", () => {
		const configs: SyncConfig[] = [
			{
				provider: "notion",
				enabled: true,
				credentials: {
					apiKey: "test-key",
					databaseId: "test-db",
				},
			},
		];
		saveSyncConfig(configs);

		const newSyncManager = new SyncManager();
		const providers = newSyncManager.getAllProviders();
		expect(providers.length).toBe(1);
		expect(providers[0].name).toBe("Notion");
	});

	it("syncs only enabled providers", async () => {
		const configs: SyncConfig[] = [
			{
				provider: "notion",
				enabled: true,
				credentials: {
					apiKey: "test-key",
					databaseId: "test-db",
				},
			},
			{
				provider: "google-tasks",
				enabled: false,
				credentials: {
					token: "test-token",
				},
			},
		];
		saveSyncConfig(configs);

		const newSyncManager = new SyncManager();
		const enabledProviders = newSyncManager.getEnabledProviders();
		expect(enabledProviders.length).toBe(1);
		expect(enabledProviders[0].name).toBe("Notion");

		// Should sync without throwing
		await expect(newSyncManager.syncAll()).resolves.not.toThrow();
	});

	it("adds a new provider", () => {
		const config: SyncConfig = {
			provider: "notion",
			enabled: true,
			credentials: {
				apiKey: "test-key",
				databaseId: "test-db",
			},
		};

		syncManager.addProvider(config);
		const provider = syncManager.getProvider("notion");

		expect(provider).toBeTruthy();
		expect(provider?.name).toBe("Notion");
		expect(provider?.enabled).toBe(true);
	});

	it("updates existing provider when adding same provider again", () => {
		const config1: SyncConfig = {
			provider: "notion",
			enabled: true,
			credentials: {
				apiKey: "old-key",
				databaseId: "old-db",
			},
		};

		const config2: SyncConfig = {
			provider: "notion",
			enabled: false,
			credentials: {
				apiKey: "new-key",
				databaseId: "new-db",
			},
		};

		syncManager.addProvider(config1);
		syncManager.addProvider(config2);

		const provider = syncManager.getProvider("notion");
		expect(provider?.enabled).toBe(false);
	});

	it("removes a provider", () => {
		const config: SyncConfig = {
			provider: "notion",
			enabled: true,
			credentials: {
				apiKey: "test-key",
				databaseId: "test-db",
			},
		};

		syncManager.addProvider(config);
		expect(syncManager.getProvider("notion")).toBeTruthy();

		syncManager.removeProvider("notion");
		expect(syncManager.getProvider("notion")).toBeUndefined();
	});

	it("handles sync errors gracefully", async () => {
		const config: SyncConfig = {
			provider: "notion",
			enabled: true,
			// Missing credentials to cause error
		};

		syncManager.addProvider(config);

		// Should not throw, should handle error internally
		await expect(syncManager.syncAll()).resolves.not.toThrow();
	});

	it("returns undefined for non-existent provider", () => {
		const provider = syncManager.getProvider("non-existent");
		expect(provider).toBeUndefined();
	});

	it("can add multiple different providers", () => {
		const notionConfig: SyncConfig = {
			provider: "notion",
			enabled: true,
			credentials: {
				apiKey: "notion-key",
				databaseId: "notion-db",
			},
		};

		const googleConfig: SyncConfig = {
			provider: "google-tasks",
			enabled: true,
			credentials: {
				token: "google-token",
			},
		};

		syncManager.addProvider(notionConfig);
		syncManager.addProvider(googleConfig);

		expect(syncManager.getAllProviders().length).toBe(2);
		expect(syncManager.getProvider("notion")).toBeTruthy();
		expect(syncManager.getProvider("google-tasks")).toBeTruthy();
	});
});

