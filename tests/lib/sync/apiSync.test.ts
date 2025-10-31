import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadSyncConfig, saveSyncConfig, type SyncConfig } from "@/lib/sync/apiSync";

describe("apiSync - Configuration Storage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("loads empty config when localStorage is empty", () => {
		const configs = loadSyncConfig();
		expect(configs).toEqual([]);
	});

	it("loads sync config from localStorage", () => {
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
		localStorage.setItem("todos:sync-config", JSON.stringify(configs));

		const loaded = loadSyncConfig();
		expect(loaded).toEqual(configs);
	});

	it("saves sync config to localStorage", () => {
		const configs: SyncConfig[] = [
			{
				provider: "google-tasks",
				enabled: false,
				credentials: {
					token: "test-token",
				},
			},
		];

		saveSyncConfig(configs);

		const stored = localStorage.getItem("todos:sync-config");
		expect(stored).toBeTruthy();
		const parsed = JSON.parse(stored!);
		expect(parsed).toEqual(configs);
	});

	it("handles invalid JSON in localStorage gracefully", () => {
		localStorage.setItem("todos:sync-config", "invalid json");
		const configs = loadSyncConfig();
		expect(configs).toEqual([]);
	});

	it("handles localStorage errors gracefully", () => {
		const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("Storage quota exceeded");
		});

		const configs: SyncConfig[] = [
			{
				provider: "notion",
				enabled: true,
			},
		];

		// Should not throw
		expect(() => saveSyncConfig(configs)).not.toThrow();

		spy.mockRestore();
	});
});

