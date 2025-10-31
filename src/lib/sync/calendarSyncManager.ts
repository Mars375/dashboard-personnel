// Gestionnaire de synchronisation pour le calendrier

import type {
	CalendarSyncProvider,
	CalendarSyncResult,
	CalendarSyncConfig,
} from "./calendarSync";
import { GoogleCalendarSyncProvider } from "./googleCalendarSync";
import { OutlookSyncProvider } from "./outlookSync";
// Notion provider sera créé si nécessaire
import { loadSyncConfig, saveSyncConfig } from "./calendarSync";

export class CalendarSyncManager {
	private providers: Map<string, CalendarSyncProvider> = new Map();

	constructor() {
		const config = loadSyncConfig();
		this.loadProviders(config);
	}

	private loadProviders(config: CalendarSyncConfig): void {
		if (config.providers.googleCalendar?.enabled) {
			const provider = new GoogleCalendarSyncProvider({
				apiKey: config.providers.googleCalendar.apiKey,
				calendarId: config.providers.googleCalendar.calendarId,
			});
			provider.enabled = true;
			this.providers.set("googleCalendar", provider);
		}

		if (config.providers.outlook?.enabled) {
			const provider = new OutlookSyncProvider({
				clientId: config.providers.outlook.clientId,
				accessToken: config.providers.outlook.accessToken,
			});
			provider.enabled = true;
			this.providers.set("outlook", provider);
		}

		// Notion provider à implémenter
	}

	async syncAll(): Promise<CalendarSyncResult[]> {
		const results: CalendarSyncResult[] = [];

		for (const provider of this.providers.values()) {
			if (provider.enabled) {
				try {
					const result = await provider.sync();
					results.push(result);
				} catch (error) {
					results.push({
						success: false,
						synced: 0,
						errors: [error instanceof Error ? error.message : "Unknown error"],
					});
				}
			}
		}

		return results;
	}

	addProvider(name: string, provider: CalendarSyncProvider): void {
		this.providers.set(name, provider);
	}

	removeProvider(name: string): void {
		this.providers.delete(name);
	}

	getAllProviders(): CalendarSyncProvider[] {
		return Array.from(this.providers.values());
	}

	getEnabledProviders(): CalendarSyncProvider[] {
		return Array.from(this.providers.values()).filter((p) => p.enabled);
	}

	updateConfig(config: CalendarSyncConfig): void {
		saveSyncConfig(config);
		this.loadProviders(config);
	}
}

export const calendarSyncManager = new CalendarSyncManager();

