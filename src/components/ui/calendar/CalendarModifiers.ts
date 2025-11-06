/**
 * Logique des modifiers pour le calendrier (dates avec événements, todos, etc.)
 */

import type { CalendarEvent } from "@/widgets/Calendar/types";
import { formatDateLocal } from "@/lib/utils";

export interface CalendarModifiers {
	hasEvents: (date: Date) => boolean;
	hasTodos: (date: Date) => boolean;
}

export interface CalendarModifiersClassNames {
	hasEvents: string;
	hasTodos: string;
}

/**
 * Calcule les modifiers pour les dates du calendrier
 */
export function calculateModifiers(
	events: CalendarEvent[],
	todosWithDeadlines?: Array<{
		id: string;
		title: string;
		deadline: string;
		listName?: string;
	}>
): CalendarModifiers {
	// Créer un Set de toutes les dates qui ont des événements (y compris multi-jours)
	const eventDates = new Set<string>();
	events.forEach((event) => {
		// Parser la date en évitant les problèmes de timezone
		const [startYear, startMonth, startDay] = event.date
			.split("-")
			.map(Number);
		const startDate = new Date(startYear, startMonth - 1, startDay);
		startDate.setHours(0, 0, 0, 0);

		if (event.endDate) {
			// Événement multi-jours : ajouter toutes les dates de la plage
			const [endYear, endMonth, endDay] = event.endDate
				.split("-")
				.map(Number);
			const endDate = new Date(endYear, endMonth - 1, endDay);
			endDate.setHours(23, 59, 59, 999);

			for (
				let d = new Date(startDate);
				d <= endDate;
				d.setDate(d.getDate() + 1)
			) {
				eventDates.add(formatDateLocal(d));
			}
		} else {
			// Événement d'un seul jour
			eventDates.add(formatDateLocal(startDate));
		}
	});

	const todoDates = new Set(
		todosWithDeadlines?.map((todo) => {
			const deadlineDate = new Date(todo.deadline);
			return formatDateLocal(deadlineDate);
		}) || []
	);

	return {
		hasEvents: (date: Date) => eventDates.has(formatDateLocal(date)),
		hasTodos: (date: Date) => todoDates.has(formatDateLocal(date)),
	};
}

/**
 * Retourne les classNames CSS pour chaque modifier
 */
export function getModifiersClassNames(): CalendarModifiersClassNames {
	return {
		hasEvents:
			"relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
		hasTodos:
			"relative before:absolute before:top-1 before:right-1 before:w-1.5 before:h-1.5 before:rounded-full before:bg-orange-500",
	};
}


