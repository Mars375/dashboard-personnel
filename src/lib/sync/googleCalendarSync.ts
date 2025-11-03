// Provider de synchronisation Google Calendar avec OAuth

import type {
	CalendarSyncProvider,
	CalendarSyncResult,
	CalendarEvent,
} from "./calendarSync";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { format, parseISO } from "date-fns";

// Types Google Calendar API
interface GoogleCalendarEvent {
	id?: string;
	summary?: string;
	description?: string;
	start?: {
		date?: string; // YYYY-MM-DD (all-day)
		dateTime?: string; // ISO 8601 (timed)
		timeZone?: string;
	};
	end?: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	colorId?: string;
	recurrence?: string[]; // RRULE format
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
	}>;
}

interface GoogleEventsResponse {
	items: GoogleCalendarEvent[];
	nextPageToken?: string;
}

export class GoogleCalendarSyncProvider implements CalendarSyncProvider {
	name = "Google Calendar";
	enabled: boolean;
	calendarId: string;

	constructor(config?: { calendarId?: string }) {
		this.enabled = false;
		this.calendarId = config?.calendarId || "primary"; // "primary" = calendrier principal
	}

	/**
	 * Récupère un token d'accès valide
	 */
	private async getAccessToken(): Promise<string> {
		const manager = getOAuthManager();
		if (!manager.isConnected("google")) {
			throw new Error("Non connecté à Google. Veuillez vous connecter d'abord.");
		}
		return await manager.getValidAccessToken("google");
	}

	/**
	 * Récupère le calendrier principal ou celui spécifié
	 */
	async getCalendarId(): Promise<string> {
		if (this.calendarId !== "primary") {
			return this.calendarId;
		}

		try {
			const accessToken = await this.getAccessToken();
			const response = await fetch(
				"https://www.googleapis.com/calendar/v3/users/me/calendarList",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Erreur lors de la récupération des calendriers: ${response.statusText}`);
			}

			const data = (await response.json()) as GoogleCalendarListResponse;
			const primaryCalendar = data.items.find((cal) => cal.primary) || data.items[0];
			
			if (!primaryCalendar) {
				throw new Error("Aucun calendrier trouvé");
			}

			this.calendarId = primaryCalendar.id;
			return this.calendarId;
		} catch (error) {
			console.error("Erreur lors de la récupération du calendrier:", error);
			throw error;
		}
	}

	/**
	 * Convertit un événement Google Calendar en CalendarEvent local
	 */
	private convertFromGoogleEvent(googleEvent: GoogleCalendarEvent): CalendarEvent {
		const id = googleEvent.id || crypto.randomUUID();
		
		// Extraire la date et l'heure
		let date: string;
		let time: string | undefined;

		if (googleEvent.start?.dateTime) {
			// Événement avec heure
			const dateTime = parseISO(googleEvent.start.dateTime);
			date = format(dateTime, "yyyy-MM-dd");
			time = format(dateTime, "HH:mm");
		} else if (googleEvent.start?.date) {
			// Événement toute la journée
			date = googleEvent.start.date;
			time = undefined;
		} else {
			// Fallback
			date = format(new Date(), "yyyy-MM-dd");
			time = undefined;
		}

		// Convertir RRULE en RecurrenceRule
		let recurrence: CalendarEvent["recurrence"] | undefined;
		if (googleEvent.recurrence && googleEvent.recurrence.length > 0) {
			const rrule = googleEvent.recurrence[0];
			if (rrule.includes("FREQ=DAILY")) {
				recurrence = { type: "daily", interval: 1 };
			} else if (rrule.includes("FREQ=WEEKLY")) {
				recurrence = { type: "weekly", interval: 1 };
			} else if (rrule.includes("FREQ=MONTHLY")) {
				recurrence = { type: "monthly", interval: 1 };
			} else if (rrule.includes("FREQ=YEARLY")) {
				recurrence = { type: "yearly", interval: 1 };
			}

			// Parser COUNT ou UNTIL
			const countMatch = rrule.match(/COUNT=(\d+)/);
			if (countMatch) {
				recurrence = { ...recurrence, count: parseInt(countMatch[1], 10) };
			}

			const untilMatch = rrule.match(/UNTIL=(\d{8})/);
			if (untilMatch) {
				const untilDate = untilMatch[1];
				recurrence = {
					...recurrence,
					endDate: `${untilDate.slice(0, 4)}-${untilDate.slice(4, 6)}-${untilDate.slice(6, 8)}`,
				};
			}
		}

		// Extraire le rappel (prendre le premier rappel popup)
		let reminderMinutes: number | undefined;
		if (googleEvent.reminders?.overrides) {
			const popupReminder = googleEvent.reminders.overrides.find(
				(r) => r.method === "popup",
			);
			if (popupReminder) {
				reminderMinutes = popupReminder.minutes;
			}
		}

		return {
			id,
			title: googleEvent.summary || "Sans titre",
			date,
			time,
			description: googleEvent.description,
			color: googleEvent.colorId ? this.mapGoogleColorToHex(googleEvent.colorId) : undefined,
			recurrence,
			reminderMinutes,
			createdAt: googleEvent.created || new Date().toISOString(),
			updatedAt: googleEvent.updated || new Date().toISOString(),
		};
	}

	/**
	 * Convertit un CalendarEvent local en événement Google Calendar
	 */
	private convertToGoogleEvent(event: CalendarEvent): Partial<GoogleCalendarEvent> {
		const googleEvent: Partial<GoogleCalendarEvent> = {
			summary: event.title,
			description: event.description,
		};

		// Date et heure
		if (event.time) {
			// Événement avec heure
			const dateTime = new Date(`${event.date}T${event.time}`);
			googleEvent.start = {
				dateTime: dateTime.toISOString(),
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};
			googleEvent.end = {
				dateTime: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString(), // +1h par défaut
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};
		} else {
			// Événement toute la journée
			googleEvent.start = {
				date: event.date,
			};
			googleEvent.end = {
				date: event.date,
			};
		}

		// Couleur
		if (event.color) {
			googleEvent.colorId = this.mapHexToGoogleColor(event.color);
		}

		// Répétition
		if (event.recurrence && event.recurrence.type !== "none") {
			const rrule = this.convertRecurrenceToRRULE(event.recurrence);
			if (rrule) {
				googleEvent.recurrence = [rrule];
			}
		}

		// Rappels
		if (event.reminderMinutes !== undefined) {
			googleEvent.reminders = {
				useDefault: false,
				overrides: [
					{
						method: "popup",
						minutes: event.reminderMinutes,
					},
				],
			};
		}

		return googleEvent;
	}

	/**
	 * Convertit RecurrenceRule en RRULE Google Calendar
	 */
	private convertRecurrenceToRRULE(recurrence: CalendarEvent["recurrence"]): string | null {
		if (!recurrence || recurrence.type === "none") return null;

		const freq = {
			daily: "DAILY",
			weekly: "WEEKLY",
			monthly: "MONTHLY",
			yearly: "YEARLY",
		}[recurrence.type];

		if (!freq) return null;

		let rrule = `RRULE:FREQ=${freq}`;

		if (recurrence.interval && recurrence.interval > 1) {
			rrule += `;INTERVAL=${recurrence.interval}`;
		}

		if (recurrence.count) {
			rrule += `;COUNT=${recurrence.count}`;
		}

		if (recurrence.endDate) {
			const until = recurrence.endDate.replace(/-/g, "");
			rrule += `;UNTIL=${until}`;
		}

		return rrule;
	}

	/**
	 * Mappe les IDs de couleur Google Calendar vers des codes hexadécimaux
	 */
	private mapGoogleColorToHex(colorId: string): string {
		const colorMap: Record<string, string> = {
			"1": "#7986cb", // Lavande
			"2": "#33b679", // Sage
			"3": "#8e24aa", // Raisin
			"4": "#e67c73", // Flamingo
			"5": "#f6bf26", // Banane
			"6": "#f4511e", // Mandarine
			"7": "#039be5", // Peacock
			"8": "#616161", // Graphite
			"9": "#0b8043", // Blueberry
			"10": "#d50000", // Basil
			"11": "#e4c441", // Tomate
		};
		return colorMap[colorId] || "#7986cb";
	}

	/**
	 * Mappe les codes hexadécimaux vers les IDs de couleur Google Calendar
	 */
	private mapHexToGoogleColor(hex: string): string {
		// Mapping approximatif basé sur la couleur la plus proche
		// Pour un mapping précis, il faudrait utiliser une librairie de conversion de couleur
		return "1"; // Par défaut
	}

	/**
	 * Synchronise les événements (pull puis push)
	 */
	async sync(): Promise<CalendarSyncResult> {
		if (!this.enabled) {
			return {
				success: false,
				synced: 0,
				errors: ["Google Calendar sync is disabled"],
			};
		}

		try {
			const calendarId = await this.getCalendarId();
			
			// Pull les événements depuis Google
			const pulledEvents = await this.pullEvents();
			
			// Pour le moment, on ne fait que pull
			// Le push sera fait manuellement ou via une autre méthode
			
			return {
				success: true,
				synced: pulledEvents.length,
				errors: [],
			};
		} catch (error) {
			return {
				success: false,
				synced: 0,
				errors: [error instanceof Error ? error.message : "Unknown error"],
			};
		}
	}

	/**
	 * Pousse les événements vers Google Calendar
	 */
	async pushEvents(events: CalendarEvent[]): Promise<void> {
		if (!this.enabled) {
			throw new Error("Google Calendar sync is disabled");
		}

		const accessToken = await this.getAccessToken();
		const calendarId = await this.getCalendarId();

		for (const event of events) {
			try {
				const googleEvent = this.convertToGoogleEvent(event);

				// Si l'événement a un ID, tenter de mettre à jour
				// Sinon, créer un nouvel événement
				if (event.id && event.id.startsWith("google-")) {
					// ID Google existant, mettre à jour
					const googleEventId = event.id.replace("google-", "");
					const response = await fetch(
						`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
						{
							method: "PUT",
							headers: {
								Authorization: `Bearer ${accessToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(googleEvent),
						},
					);

					if (!response.ok) {
						const error = await response.json();
						throw new Error(`Erreur lors de la mise à jour: ${error.error?.message || response.statusText}`);
					}
				} else {
					// Créer un nouvel événement
					const response = await fetch(
						`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${accessToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(googleEvent),
						},
					);

					if (!response.ok) {
						const error = await response.json();
						throw new Error(`Erreur lors de la création: ${error.error?.message || response.statusText}`);
					}

					// Mettre à jour l'ID de l'événement avec celui de Google
					const createdEvent = (await response.json()) as GoogleCalendarEvent;
					if (createdEvent.id) {
						// On pourrait sauvegarder le mapping ID local -> ID Google ici
						console.log(`Événement créé avec l'ID Google: ${createdEvent.id}`);
					}
				}
			} catch (error) {
				console.error(`Erreur lors du push de l'événement ${event.id}:`, error);
				// Continuer avec les autres événements
			}
		}
	}

	/**
	 * Récupère les événements depuis Google Calendar
	 */
	async pullEvents(): Promise<CalendarEvent[]> {
		if (!this.enabled) {
			throw new Error("Google Calendar sync is disabled");
		}

		const accessToken = await this.getAccessToken();
		const calendarId = await this.getCalendarId();

		// Récupérer les événements des 3 derniers mois et des 3 prochains mois
		const now = new Date();
		const threeMonthsAgo = new Date(now);
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
		const threeMonthsFromNow = new Date(now);
		threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

		const timeMin = threeMonthsAgo.toISOString();
		const timeMax = threeMonthsFromNow.toISOString();

		const events: CalendarEvent[] = [];
		let pageToken: string | undefined;

		do {
			const params = new URLSearchParams({
				timeMin,
				timeMax,
				singleEvents: "true", // Développer les événements récurrents
				orderBy: "startTime",
				maxResults: "2500",
			});

			if (pageToken) {
				params.append("pageToken", pageToken);
			}

			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(`Erreur lors de la récupération: ${error.error?.message || response.statusText}`);
			}

			const data = (await response.json()) as GoogleEventsResponse;

			for (const googleEvent of data.items || []) {
				try {
					const localEvent = this.convertFromGoogleEvent(googleEvent);
					// Préfixer l'ID avec "google-" pour identifier l'origine
					if (googleEvent.id) {
						localEvent.id = `google-${googleEvent.id}`;
					}
					events.push(localEvent);
				} catch (error) {
					console.error("Erreur lors de la conversion d'un événement:", error);
					// Continuer avec les autres événements
				}
			}

			pageToken = data.nextPageToken;
		} while (pageToken);

		return events;
	}

	/**
	 * Supprime un événement de Google Calendar
	 */
	async deleteEvent(eventId: string): Promise<void> {
		if (!this.enabled) {
			throw new Error("Google Calendar sync is disabled");
		}

		// Extraire l'ID Google si c'est un événement synchronisé
		if (!eventId.startsWith("google-")) {
			throw new Error("Cet événement n'est pas un événement Google Calendar");
		}

		const googleEventId = eventId.replace("google-", "");
		const accessToken = await this.getAccessToken();
		const calendarId = await this.getCalendarId();

		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(`Erreur lors de la suppression: ${error.error?.message || response.statusText}`);
		}
	}
}
