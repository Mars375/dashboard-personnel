// Provider de synchronisation Google Calendar (placeholder)

import type {
	CalendarSyncProvider,
	CalendarSyncResult,
	CalendarEvent,
} from "./calendarSync";

export class GoogleCalendarSyncProvider implements CalendarSyncProvider {
	name = "Google Calendar";
	enabled: boolean;
	apiKey?: string;
	calendarId?: string;

	constructor(config?: { apiKey?: string; calendarId?: string }) {
		this.enabled = false;
		this.apiKey = config?.apiKey;
		this.calendarId = config?.calendarId;
	}

	async sync(): Promise<CalendarSyncResult> {
		// TODO: Implémenter la synchronisation Google Calendar
		return {
			success: false,
			synced: 0,
			errors: ["Google Calendar sync not yet implemented"],
		};
	}

	async pushEvents(events: CalendarEvent[]): Promise<void> {
		// TODO: Implémenter push vers Google Calendar
		console.log("Push events to Google Calendar (not implemented)", events.length);
	}

	async pullEvents(): Promise<CalendarEvent[]> {
		// TODO: Implémenter pull depuis Google Calendar
		console.log("Pull events from Google Calendar (not implemented)");
		return [];
	}
}

