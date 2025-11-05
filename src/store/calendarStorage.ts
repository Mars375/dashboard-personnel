// Persistance localStorage pour les événements du calendrier

import type { CalendarEvent } from "@/widgets/Calendar/types";
import { logger } from "@/lib/logger";

const STORAGE_KEY = "calendar:events";

/**
 * Charge les événements depuis localStorage
 */
export function loadCalendarEvents(): CalendarEvent[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			logger.debug("📥 Aucun événement trouvé dans localStorage");
			return [];
		}
		const events = JSON.parse(stored) as CalendarEvent[];
		logger.debug("📥 Chargement de", events.length, "événement(s) depuis localStorage");
		// Valider que les événements ont les champs requis
		// Accepter les événements avec ID Google (commençant par "google-")
		const validEvents = events.filter(
			(e) => e.id && e.title && e.date && (e.createdAt || e.updatedAt)
		);
		if (validEvents.length !== events.length) {
			logger.warn("⚠️", events.length - validEvents.length, "événement(s) invalide(s) filtré(s)");
		}
		return validEvents;
	} catch (error) {
		logger.error("❌ Erreur lors du chargement des événements:", error);
		return [];
	}
}

/**
 * Sauvegarde les événements dans localStorage
 */
export function saveCalendarEvents(events: CalendarEvent[]): void {
	try {
		logger.debug("💾 Sauvegarde des événements:", events.length, "événement(s)");
		localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
		logger.debug("✅ Événements sauvegardés avec succès");
	} catch (error) {
		logger.error("❌ Erreur lors de la sauvegarde des événements:", error);
	}
}

