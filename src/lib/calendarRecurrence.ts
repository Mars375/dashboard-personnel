// Utilitaires pour gérer la répétition d'événements
import type { CalendarEvent } from "@/widgets/Calendar/types";
import { addDays, isBefore, isSameDay } from "date-fns";

// Fonction utilitaire pour formater une date en YYYY-MM-DD
function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Génère toutes les occurrences d'un événement récurrent jusqu'à une date limite
 */
export function generateRecurringEvents(
	event: CalendarEvent,
	endDate: Date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
): CalendarEvent[] {
	if (!event.recurrence || event.recurrence.type === "none") {
		return [event];
	}

	const occurrences: CalendarEvent[] = [];
	const startDate = new Date(event.date);
	const recurrence = event.recurrence;
	const interval = recurrence.interval || 1;

	// Date de fin : soit endDate dans recurrence, soit endDate fournie
	const finalEndDate = recurrence.endDate
		? new Date(recurrence.endDate)
		: endDate;

	// Limite par nombre d'occurrences
	const maxOccurrences = recurrence.count || Infinity;

	let currentDate = new Date(startDate);
	let occurrenceCount = 0;

	while (
		(isBefore(currentDate, finalEndDate) || isSameDay(currentDate, finalEndDate)) &&
		occurrenceCount < maxOccurrences
	) {
		occurrences.push({
			...event,
			id: `${event.id}-occ-${occurrenceCount}`,
			date: formatDateLocal(currentDate),
		});

		// Calculer la prochaine occurrence
	switch (recurrence.type) {
		case "daily":
			currentDate = addDays(currentDate, interval);
			break;
		case "weekly": {
			currentDate = addDays(currentDate, interval * 7);
			break;
		}
		case "monthly": {
			const month = currentDate.getMonth();
			currentDate.setMonth(month + interval);
			break;
		}
		case "yearly": {
			const year = currentDate.getFullYear();
			currentDate.setFullYear(year + interval);
			break;
		}
	}

		occurrenceCount++;
	}

	return occurrences;
}

/**
 * Vérifie si une date correspond à un événement récurrent
 */
export function isDateInRecurrence(
	date: Date,
	event: CalendarEvent
): boolean {
	if (!event.recurrence || event.recurrence.type === "none") {
		return event.date === formatDateLocal(date);
	}

	const startDate = new Date(event.date);
	const recurrence = event.recurrence;
	const interval = recurrence.interval || 1;

	// Vérifier que la date est après la date de début
	if (isBefore(date, startDate)) {
		return false;
	}

	// Vérifier la date de fin si elle existe
	if (recurrence.endDate) {
		const endDate = new Date(recurrence.endDate);
		if (isBefore(endDate, date)) {
			return false;
		}
	}

	// Vérifier selon le type de répétition
	const daysDiff = Math.floor(
		(date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
	);

	switch (recurrence.type) {
		case "daily":
			return daysDiff >= 0 && daysDiff % interval === 0;
		case "weekly": {
			const weeksDiff = Math.floor(daysDiff / 7);
			return weeksDiff >= 0 && weeksDiff % interval === 0 && date.getDay() === startDate.getDay();
		}
		case "monthly":
			// Vérifier que c'est le même jour du mois
			if (date.getDate() !== startDate.getDate()) return false;
			const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
			return monthsDiff >= 0 && monthsDiff % interval === 0;
		case "yearly":
			// Vérifier que c'est le même jour et mois
			if (date.getMonth() !== startDate.getMonth() || date.getDate() !== startDate.getDate()) return false;
			const yearsDiff = date.getFullYear() - startDate.getFullYear();
			return yearsDiff >= 0 && yearsDiff % interval === 0;
		default:
			return false;
	}
}

