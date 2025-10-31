// Types pour le Calendar Widget

export interface CalendarEvent {
	id: string;
	title: string;
	date: string; // Format: YYYY-MM-DD
	time?: string; // Format: HH:mm (optionnel)
	description?: string;
	color?: string; // Couleur de l'événement
	createdAt: string;
	updatedAt: string;
}

export type CalendarView = "month" | "week" | "day";

export interface CalendarState {
	currentDate: Date;
	view: CalendarView;
	events: CalendarEvent[];
}

