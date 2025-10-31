// Provider de synchronisation Outlook Calendar (placeholder)

import type {
	CalendarSyncProvider,
	CalendarSyncResult,
	CalendarEvent,
} from "./calendarSync";

export class OutlookSyncProvider implements CalendarSyncProvider {
	name = "Outlook Calendar";
	enabled: boolean;
	clientId?: string;
	accessToken?: string;

	constructor(config?: { clientId?: string; accessToken?: string }) {
		this.enabled = false;
		this.clientId = config?.clientId;
		this.accessToken = config?.accessToken;
	}

	async sync(): Promise<CalendarSyncResult> {
		// TODO: Implémenter la synchronisation Outlook
		return {
			success: false,
			synced: 0,
			errors: ["Outlook sync not yet implemented"],
		};
	}

	async pushEvents(events: CalendarEvent[]): Promise<void> {
		// TODO: Implémenter push vers Outlook
		console.log("Push events to Outlook (not implemented)", events.length);
	}

	async pullEvents(): Promise<CalendarEvent[]> {
		// TODO: Implémenter pull depuis Outlook
		console.log("Pull events from Outlook (not implemented)");
		return [];
	}
}

