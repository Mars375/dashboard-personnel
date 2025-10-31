import { loadSyncConfig, saveSyncConfig, type SyncConfig } from "./apiSync";
import { NotionSyncProvider } from "./notionSync";
import { GoogleTasksSyncProvider } from "./googleTasksSync";
import type { SyncProvider } from "./apiSync";

export class SyncManager {
	private providers: Map<string, SyncProvider> = new Map();

	constructor() {
		this.loadProviders();
	}

	private loadProviders(): void {
		const configs = loadSyncConfig();
		configs.forEach((config) => {
			let provider: SyncProvider;

			switch (config.provider) {
				case "notion":
					provider = new NotionSyncProvider(config);
					break;
				case "google-tasks":
					provider = new GoogleTasksSyncProvider(config);
					break;
				default:
					return;
			}

			this.providers.set(config.provider, provider);
		});
	}

	async syncAll(): Promise<void> {
		const enabledProviders = Array.from(this.providers.values()).filter(
			(p) => p.enabled
		);

		for (const provider of enabledProviders) {
			try {
				const result = await provider.sync();
				if (!result.success) {
					console.error(`Sync failed for ${provider.name}:`, result.error);
				}
			} catch (error) {
				console.error(`Sync error for ${provider.name}:`, error);
			}
		}
	}

	getProvider(providerName: string): SyncProvider | undefined {
		return this.providers.get(providerName);
	}

	addProvider(config: SyncConfig): void {
		let provider: SyncProvider;

		switch (config.provider) {
			case "notion":
				provider = new NotionSyncProvider(config);
				break;
			case "google-tasks":
				provider = new GoogleTasksSyncProvider(config);
				break;
			default:
				return;
		}

		this.providers.set(config.provider, provider);

		// Save to localStorage
		const configs = loadSyncConfig();
		const existingIndex = configs.findIndex((c) => c.provider === config.provider);
		if (existingIndex >= 0) {
			configs[existingIndex] = config;
		} else {
			configs.push(config);
		}
		saveSyncConfig(configs);
	}

	removeProvider(providerName: string): void {
		this.providers.delete(providerName);

		// Remove from localStorage
		const configs = loadSyncConfig().filter((c) => c.provider !== providerName);
		saveSyncConfig(configs);
	}

	getAllProviders(): SyncProvider[] {
		return Array.from(this.providers.values());
	}

	getEnabledProviders(): SyncProvider[] {
		return Array.from(this.providers.values()).filter((p) => p.enabled);
	}
}

// Singleton instance
export const syncManager = new SyncManager();

