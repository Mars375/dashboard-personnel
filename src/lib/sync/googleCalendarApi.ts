/**
 * API Client pour Google Calendar
 * Séparé de googleCalendarSync pour améliorer la maintenabilité
 */

import { getOAuthManager } from "@/lib/auth/oauthManager";
import { logger } from "@/lib/logger";

// Types Google Calendar API
interface GoogleCalendarEvent {
	id?: string;
	summary?: string;
	description?: string;
	start?: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	end?: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	colorId?: string;
	recurrence?: string[];
	reminders?: {
		useDefault?: boolean;
		overrides?: Array<{
			method: "email" | "popup";
			minutes: number;
		}>;
	};
	created?: string;
	updated?: string;
}

interface GoogleCalendarListResponse {
	items: Array<{
		id: string;
		summary: string;
		primary?: boolean;
		accessRole?: string;
		hidden?: boolean;
	}>;
}

interface GoogleEventsResponse {
	items?: GoogleCalendarEvent[];
	nextPageToken?: string;
}

/**
 * Classe pour gérer les appels API Google Calendar
 */
export class GoogleCalendarApi {
	/**
	 * Récupère le token d'accès OAuth
	 */
	private async getAccessToken(): Promise<string> {
		const oauthManager = getOAuthManager();
		if (!oauthManager.isConnected("google")) {
			throw new Error("Google Calendar non connecté");
		}
		return await oauthManager.getValidAccessToken("google");
	}

	/**
	 * Récupère tous les calendriers disponibles
	 */
	async getAllCalendars(): Promise<
		Array<{ id: string; summary: string; primary?: boolean }>
	> {
		const accessToken = await this.getAccessToken();
		const response = await fetch(
			"https://www.googleapis.com/calendar/v3/users/me/calendarList",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(
				`Erreur lors de la récupération des calendriers: ${
					error.error?.message || response.statusText
				}`
			);
		}

		const data = (await response.json()) as GoogleCalendarListResponse;
		return (
			data.items
				?.filter((cal) => !cal.hidden)
				.map((cal) => ({
					id: cal.id,
					summary: cal.summary,
					primary: cal.primary,
				})) || []
		);
	}

	/**
	 * Récupère les événements d'un calendrier
	 */
	async getEvents(
		calendarId: string,
		timeMin: string,
		timeMax: string,
		pageToken?: string
	): Promise<GoogleEventsResponse> {
		const accessToken = await this.getAccessToken();
		const url = new URL(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
				calendarId
			)}/events`
		);
		url.searchParams.set("timeMin", timeMin);
		url.searchParams.set("timeMax", timeMax);
		url.searchParams.set("singleEvents", "true");
		url.searchParams.set("orderBy", "startTime");
		url.searchParams.set("maxResults", "2500");
		if (pageToken) {
			url.searchParams.set("pageToken", pageToken);
		}

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			if (response.status === 403 || response.status === 404) {
				logger.warn(
					`Calendrier ${calendarId} non accessible, ignoré`
				);
				return { items: [] };
			}
			const error = await response.json();
			throw new Error(
				`Erreur lors de la récupération: ${
					error.error?.message || response.statusText
				}`
			);
		}

		return (await response.json()) as GoogleEventsResponse;
	}

	/**
	 * Crée un événement dans un calendrier
	 */
	async createEvent(
		calendarId: string,
		event: GoogleCalendarEvent
	): Promise<GoogleCalendarEvent> {
		const accessToken = await this.getAccessToken();
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
				calendarId
			)}/events`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(event),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Erreur lors de la création: ${
					error.error?.message || response.statusText
				}`
			);
		}

		return (await response.json()) as GoogleCalendarEvent;
	}

	/**
	 * Met à jour un événement
	 */
	async updateEvent(
		calendarId: string,
		eventId: string,
		event: GoogleCalendarEvent
	): Promise<GoogleCalendarEvent> {
		const accessToken = await this.getAccessToken();
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
				calendarId
			)}/events/${encodeURIComponent(eventId)}`,
			{
				method: "PUT",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(event),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Erreur lors de la mise à jour: ${
					error.error?.message || response.statusText
				}`
			);
		}

		return (await response.json()) as GoogleCalendarEvent;
	}

	/**
	 * Supprime un événement
	 */
	async deleteEvent(calendarId: string, eventId: string): Promise<void> {
		const accessToken = await this.getAccessToken();
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
				calendarId
			)}/events/${encodeURIComponent(eventId)}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok && response.status !== 404) {
			const error = await response.json().catch(() => ({}));
			throw new Error(
				`Erreur lors de la suppression: ${
					error.error?.message || response.statusText
				}`
			);
		}
	}
}

// Export des types pour utilisation dans googleCalendarMapper
export type { GoogleCalendarEvent, GoogleEventsResponse };

