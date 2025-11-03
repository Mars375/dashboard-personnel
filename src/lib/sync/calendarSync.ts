// Interfaces et providers pour la synchronisation de calendrier

import type { CalendarEvent } from "@/widgets/Calendar/types";

export type { CalendarEvent };

export interface CalendarSyncProvider {
	name: string;
	enabled: boolean;
	sync(): Promise<CalendarSyncResult>;
	pushEvents(events: CalendarEvent[]): Promise<CalendarEvent[]>;
	pullEvents(): Promise<CalendarEvent[]>;
}

export interface CalendarSyncResult {
	success: boolean;
	synced: number;
	errors?: string[];
}

export interface CalendarSyncConfig {
	providers: {
		googleCalendar?: {
			enabled: boolean;
			calendarId?: string; // "primary" par défaut
		};
		outlook?: {
			enabled: boolean;
			clientId?: string;
			accessToken?: string;
		};
		notion?: {
			enabled: boolean;
			apiKey?: string;
			databaseId?: string;
		};
	};
}

const STORAGE_KEY = "calendar:sync-config";

export function loadSyncConfig(): CalendarSyncConfig {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { providers: {} };
		}
		return JSON.parse(stored) as CalendarSyncConfig;
	} catch {
		return { providers: {} };
	}
}

export function saveSyncConfig(config: CalendarSyncConfig): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	} catch (error) {
		console.error("Erreur lors de la sauvegarde de la config:", error);
	}
}

