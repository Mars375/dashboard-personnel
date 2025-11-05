/**
 * Mapper pour convertir entre Google Calendar et CalendarEvent
 * Séparé de googleCalendarSync pour améliorer la maintenabilité
 */

import { format, parseISO } from "date-fns";
import { logger } from "@/lib/logger";
import type { CalendarEvent } from "@/widgets/Calendar/types";
import type { GoogleCalendarEvent } from "./googleCalendarApi";

/**
 * Convertit un événement Google Calendar en événement local
 */
export function mapGoogleEventToLocal(
	googleEvent: GoogleCalendarEvent,
	calendarSummary: string
): CalendarEvent | null {
	try {
		// Ignorer les événements annulés
		if (googleEvent.summary?.startsWith("CANCELED:")) {
			return null;
		}

		const startDate = googleEvent.start?.date || googleEvent.start?.dateTime;
		const endDate = googleEvent.end?.date || googleEvent.end?.dateTime;

		if (!startDate) {
			return null;
		}

		// Extraire la date (YYYY-MM-DD)
		const dateStr = startDate.split("T")[0];

		// Extraire l'heure si disponible
		let time: string | undefined;
		let endTime: string | undefined;
		if (googleEvent.start?.dateTime) {
			const startDateTime = parseISO(googleEvent.start.dateTime);
			time = format(startDateTime, "HH:mm");
		}
		if (googleEvent.end?.dateTime && endDate) {
			const endDateTime = parseISO(endDate);
			endTime = format(endDateTime, "HH:mm");
		}

		// Déterminer la date de fin si c'est un événement multi-jours
		let endDateStr: string | undefined;
		if (endDate) {
			const endDateOnly = endDate.split("T")[0];
			if (endDateOnly !== dateStr) {
				endDateStr = endDateOnly;
			}
		}

		// Convertir la couleur Google en couleur locale
		let color = "";
		if (googleEvent.colorId) {
			// Mapping des couleurs Google Calendar (1-11)
			const colorMap: Record<string, string> = {
				"1": "#a4bdfc", // Lavender
				"2": "#7ae7bf", // Sage
				"3": "#dbadff", // Grape
				"4": "#ff887c", // Flamingo
				"5": "#fbd75b", // Banana
				"6": "#ffb878", // Tangerine
				"7": "#46d6db", // Peacock
				"8": "#e1e1e1", // Graphite
				"9": "#5484ed", // Blueberry
				"10": "#51b749", // Basil
				"11": "#dc2127", // Tomato
			};
			color = colorMap[googleEvent.colorId] || "";
		}

		const localEvent: CalendarEvent = {
			id: `google-${googleEvent.id}`,
			title: googleEvent.summary || "Sans titre",
			date: dateStr,
			endDate: endDateStr,
			time,
			endTime,
			description: googleEvent.description || "",
			color,
			sourceCalendar: calendarSummary,
			createdAt: googleEvent.created || new Date().toISOString(),
			updatedAt: googleEvent.updated || new Date().toISOString(),
		};

		return localEvent;
	} catch (error) {
		logger.error("Erreur lors de la conversion d'un événement:", error);
		return null;
	}
}

/**
 * Convertit un événement local en événement Google Calendar
 */
export function mapLocalEventToGoogle(
	localEvent: CalendarEvent
): GoogleCalendarEvent {
	const googleEvent: GoogleCalendarEvent = {
		summary: localEvent.title,
		description: localEvent.description,
	};

	// Date de début
	if (localEvent.time) {
		// Événement avec heure
		const startDateTime = new Date(`${localEvent.date}T${localEvent.time}`);
		googleEvent.start = {
			dateTime: startDateTime.toISOString(),
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};

		// Date de fin avec heure
		if (localEvent.endTime) {
			const endDate = localEvent.endDate || localEvent.date;
			const endDateTime = new Date(`${endDate}T${localEvent.endTime}`);
			googleEvent.end = {
				dateTime: endDateTime.toISOString(),
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};
		} else if (localEvent.endDate) {
			// Fin multi-jours
			const endDateTime = new Date(`${localEvent.endDate}T23:59:59`);
			googleEvent.end = {
				dateTime: endDateTime.toISOString(),
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};
		}
	} else {
		// Événement toute la journée
		googleEvent.start = {
			date: localEvent.date,
		};

		if (localEvent.endDate) {
			// Pour les événements multi-jours, ajouter 1 jour à la date de fin
			const endDate = new Date(localEvent.endDate);
			endDate.setDate(endDate.getDate() + 1);
			googleEvent.end = {
				date: format(endDate, "yyyy-MM-dd"),
			};
		} else {
			googleEvent.end = {
				date: localEvent.date,
			};
		}
	}

	// Couleur (si disponible)
	if (localEvent.color) {
		// Mapping inverse des couleurs
		const colorMap: Record<string, string> = {
			"#a4bdfc": "1",
			"#7ae7bf": "2",
			"#dbadff": "3",
			"#ff887c": "4",
			"#fbd75b": "5",
			"#ffb878": "6",
			"#46d6db": "7",
			"#e1e1e1": "8",
			"#5484ed": "9",
			"#51b749": "10",
			"#dc2127": "11",
		};
		googleEvent.colorId = colorMap[localEvent.color] || "";
	}

	return googleEvent;
}

