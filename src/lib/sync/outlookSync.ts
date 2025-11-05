/**
 * Provider de synchronisation Outlook Calendar (placeholder)
 * 
 * ⚠️ Ce provider est un placeholder non implémenté.
 * Il sera complété lors de l'intégration de l'API Microsoft Graph.
 */

import type {
	CalendarSyncProvider,
	CalendarSyncResult,
	CalendarEvent,
} from "./calendarSync";
import { logger } from "@/lib/logger";

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
		// TODO: Implémenter la synchronisation Outlook via Microsoft Graph API
		logger.warn("Outlook sync not yet implemented");
		return {
			success: false,
			synced: 0,
			errors: ["Outlook sync not yet implemented"],
		};
	}

	async pushEvents(events: CalendarEvent[]): Promise<CalendarEvent[]> {
		// TODO: Implémenter push vers Outlook via Microsoft Graph API
		logger.debug("Push events to Outlook (not implemented)", events.length);
		return events; // Retourner les événements sans modification pour le moment
	}

	async pullEvents(): Promise<CalendarEvent[]> {
		// TODO: Implémenter pull depuis Outlook via Microsoft Graph API
		logger.debug("Pull events from Outlook (not implemented)");
		return [];
	}
}

