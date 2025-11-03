// Types pour le Calendar Widget

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
	type: RecurrenceType;
	interval?: number; // Intervalle (ex: toutes les 2 semaines)
	endDate?: string; // Date de fin (YYYY-MM-DD)
	count?: number; // Nombre d'occurrences
}

export interface CalendarEvent {
	id: string;
	title: string;
	date: string; // Format: YYYY-MM-DD (date de début)
	endDate?: string; // Format: YYYY-MM-DD (date de fin, optionnel pour événements multi-jours)
	time?: string; // Format: HH:mm (optionnel)
	endTime?: string; // Format: HH:mm (heure de fin, optionnel)
	description?: string;
	color?: string; // Couleur de l'événement
	recurrence?: RecurrenceRule; // Règle de répétition
	reminderMinutes?: number; // Nombre de minutes avant l'événement pour le rappel (ex: 15 = 15 min avant)
	createdAt: string;
	updatedAt: string;
	sourceCalendar?: string; // Nom du calendrier Google source (si synchronisé depuis Google Calendar)
}

export type CalendarView = "month" | "week" | "day";

export interface CalendarState {
	currentDate: Date;
	view: CalendarView;
	events: CalendarEvent[];
}

