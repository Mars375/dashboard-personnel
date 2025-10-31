// Persistance localStorage pour les événements du calendrier

import type { CalendarEvent } from "@/widgets/Calendar/types";

const STORAGE_KEY = "calendar:events";

/**
 * Charge les événements depuis localStorage
 */
export function loadCalendarEvents(): CalendarEvent[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];
		const events = JSON.parse(stored) as CalendarEvent[];
		// Valider que les événements ont les champs requis
		return events.filter(
			(e) => e.id && e.title && e.date && e.createdAt
		);
	} catch {
		return [];
	}
}

/**
 * Sauvegarde les événements dans localStorage
 */
export function saveCalendarEvents(events: CalendarEvent[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
	} catch (error) {
		console.error("Erreur lors de la sauvegarde des événements:", error);
	}
}

