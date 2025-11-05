/**
 * Provider de synchronisation Google Calendar avec OAuth
 * Orchestration de la synchronisation en utilisant googleCalendarApi et googleCalendarMapper
 */

import type {
	CalendarSyncProvider,
	CalendarSyncResult,
	CalendarEvent,
} from "./calendarSync";
import { logger } from "@/lib/logger";
import { GoogleCalendarApi } from "./googleCalendarApi";
import {
	mapGoogleEventToLocal,
	mapLocalEventToGoogle,
} from "./googleCalendarMapper";

export class GoogleCalendarSyncProvider implements CalendarSyncProvider {
	name = "Google Calendar";
	enabled: boolean;
	calendarId: string;
	private api: GoogleCalendarApi;

	constructor(config?: { calendarId?: string }) {
		this.enabled = false;
		this.calendarId = config?.calendarId || "primary";
		this.api = new GoogleCalendarApi();
	}

	/**
	 * Récupère tous les calendriers disponibles
	 */
	async getAllCalendars(): Promise<
		Array<{ id: string; summary: string; primary?: boolean }>
	> {
		try {
			const calendars = await this.api.getAllCalendars();
			// Filtrer les calendriers indésirables
			return calendars.filter((calendar) => {
				const summary = calendar.summary.toLowerCase();
				// Exclure les calendriers de semaines
				if (summary.match(/^(semaine|week)\s+\d+/i)) {
					return false;
				}
				return true;
			});
		} catch (error) {
			logger.error("Erreur lors de la récupération des calendriers:", error);
			throw error;
		}
	}

	/**
	 * Récupère le calendrier principal ou celui spécifié
	 */
	async getCalendarId(): Promise<string> {
		if (this.calendarId !== "primary") {
			return this.calendarId;
		}

		try {
			const calendars = await this.getAllCalendars();
			const primaryCalendar =
				calendars.find((cal) => cal.primary) || calendars[0];

			if (!primaryCalendar) {
				throw new Error("Aucun calendrier trouvé");
			}

			this.calendarId = primaryCalendar.id;
			return this.calendarId;
		} catch (error) {
			logger.error("Erreur lors de la récupération du calendrier:", error);
			throw error;
		}
	}

	/**
	 * Pousse des événements vers Google Calendar
	 */
	async pushEvents(
		events: CalendarEvent[]
	): Promise<CalendarEvent[]> {
		if (!this.enabled) {
			throw new Error("Google Calendar sync is disabled");
		}

		try {
			const calendarId = await this.getCalendarId();

			for (const event of events) {
				try {
					// Extraire l'ID Google si c'est un ID préfixé
					const googleEventId = event.id.startsWith("google-")
						? event.id.replace("google-", "")
						: null;

					if (googleEventId) {
						// Mise à jour d'un événement existant
						const googleEvent = mapLocalEventToGoogle(event);
						await this.api.updateEvent(calendarId, googleEventId, googleEvent);
						logger.debug(`Événement Google mis à jour: ${googleEventId}`);
					} else {
						// Création d'un nouvel événement
						const googleEvent = mapLocalEventToGoogle(event);
						const createdEvent = await this.api.createEvent(
							calendarId,
							googleEvent
						);
						if (createdEvent.id) {
							logger.debug(
								`Événement créé avec l'ID Google: ${createdEvent.id}`
							);
							// Mettre à jour l'ID de l'événement local avec le préfixe google-
							event.id = `google-${createdEvent.id}`;
						}
					}
				} catch (error) {
					logger.error(`Erreur lors du push de l'événement ${event.id}:`, error);
					throw error;
				}
			}

			return events;
		} catch (error) {
			logger.error("Erreur lors du push des événements:", error);
			throw error;
		}
	}

	/**
	 * Récupère tous les événements depuis Google Calendar
	 */
	async pullEvents(): Promise<CalendarEvent[]> {
		if (!this.enabled) {
			throw new Error("Google Calendar sync is disabled");
		}

		try {
			const calendars = await this.getAllCalendars();

			if (calendars.length === 0) {
				logger.warn("Aucun calendrier trouvé");
				return [];
			}

			// Récupérer les événements des 3 derniers mois et des 3 prochains mois
			const now = new Date();
			const threeMonthsAgo = new Date(now);
			threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
			const threeMonthsFromNow = new Date(now);
			threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

			const timeMin = threeMonthsAgo.toISOString();
			const timeMax = threeMonthsFromNow.toISOString();

			const allEvents: CalendarEvent[] = [];

			// Traiter chaque calendrier en parallèle
			const calendarPromises = calendars.map(async (calendar) => {
				const events: CalendarEvent[] = [];
				let pageToken: string | undefined;

				do {
					try {
						const data = await this.api.getEvents(
							calendar.id,
							timeMin,
							timeMax,
							pageToken
						);

						for (const googleEvent of data.items || []) {
							try {
								const localEvent = mapGoogleEventToLocal(
									googleEvent,
									calendar.summary
								);
								if (localEvent) {
									events.push(localEvent);
								}
							} catch (error) {
								logger.error("Erreur lors de la conversion d'un événement:", error);
							}
						}

						pageToken = data.nextPageToken;
					} catch (error) {
						logger.error(
							`Erreur lors de la récupération des événements du calendrier ${calendar.summary}:`,
							error
						);
						break;
					}
				} while (pageToken);

				return events;
			});

			// Attendre que tous les calendriers soient traités
			const results = await Promise.allSettled(calendarPromises);

			// Collecter tous les événements
			for (const result of results) {
				if (result.status === "fulfilled") {
					allEvents.push(...result.value);
				} else {
					logger.error("Erreur lors de la récupération des calendriers:", result.reason);
				}
			}

			logger.debug(
				`✅ ${allEvents.length} événement(s) récupéré(s) depuis ${calendars.length} calendrier(s)`
			);
			return allEvents;
		} catch (error) {
			logger.error("Erreur lors de la récupération des événements:", error);
			throw error;
		}
	}

	/**
	 * Supprime un événement de Google Calendar
	 */
	async deleteEvent(eventId: string): Promise<void> {
		if (!this.enabled) {
			throw new Error("Google Calendar sync is disabled");
		}

		try {
			const calendarId = await this.getCalendarId();
			const googleEventId = eventId.startsWith("google-")
				? eventId.replace("google-", "")
				: eventId;

			await this.api.deleteEvent(calendarId, googleEventId);
			logger.debug(`Événement Google supprimé: ${googleEventId}`);
		} catch (error) {
			logger.error(`Erreur lors de la suppression de l'événement ${eventId}:`, error);
			throw error;
		}
	}

	/**
	 * Synchronise tous les événements (pull + push)
	 */
	async sync(): Promise<CalendarSyncResult> {
		if (!this.enabled) {
			return {
				success: false,
				message: "Google Calendar sync is disabled",
				error: "Sync désactivé",
			};
		}

		try {
			const pulledEvents = await this.pullEvents();

			return {
				success: true,
				message: `Synchronisation réussie: ${pulledEvents.length} événement(s) récupéré(s)`,
				eventsPulled: pulledEvents.length,
			};
		} catch (error) {
			return {
				success: false,
				message: "Erreur lors de la synchronisation Google Calendar",
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}
