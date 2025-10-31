// Hook personnalisé pour gérer le calendrier et les événements

import { useState, useCallback, useEffect } from "react";
import type { CalendarEvent, CalendarView } from "@/widgets/Calendar/types";
import {
	loadCalendarEvents,
	saveCalendarEvents,
} from "@/store/calendarStorage";
import { isDateInRecurrence } from "@/lib/calendarRecurrence";

export function useCalendar() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState<CalendarView>("month");
	const [events, setEvents] = useState<CalendarEvent[]>([]);

	// Charger les événements au montage
	useEffect(() => {
		const loaded = loadCalendarEvents();
		setEvents(loaded);
	}, []);

	// Sauvegarder les événements à chaque changement
	useEffect(() => {
		if (events.length > 0 || loadCalendarEvents().length > 0) {
			saveCalendarEvents(events);
		}
	}, [events]);

	// Navigation
	const goToPreviousMonth = useCallback(() => {
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			newDate.setMonth(prev.getMonth() - 1);
			return newDate;
		});
	}, []);

	const goToNextMonth = useCallback(() => {
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			newDate.setMonth(prev.getMonth() + 1);
			return newDate;
		});
	}, []);

	const goToToday = useCallback(() => {
		setCurrentDate(new Date());
	}, []);

	// Gestion des événements
	const addEvent = useCallback(
		(event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
			const newEvent: CalendarEvent = {
				...event,
				id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			setEvents((prev) => [...prev, newEvent]);
			return newEvent;
		},
		[]
	);

	const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
		setEvents((prev) =>
			prev.map((event) =>
				event.id === id
					? {
							...event,
							...updates,
							updatedAt: new Date().toISOString(),
						}
					: event
			)
		);
	}, []);

	const deleteEvent = useCallback((id: string) => {
		setEvents((prev) => prev.filter((event) => event.id !== id));
	}, []);

	// Fonction utilitaire pour formater une date en YYYY-MM-DD en local (évite les problèmes de timezone)
	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	// Obtenir les événements pour une date spécifique
	const getEventsForDate = useCallback(
		(date: Date) => {
			const dateStr = formatDateLocal(date);
			return events.filter((event) => {
				// Événement direct
				if (event.date === dateStr) return true;
				
				// Événement récurrent
				if (event.recurrence && event.recurrence.type !== "none") {
					return isDateInRecurrence(date, event);
				}
				
				return false;
			});
		},
		[events]
	);

	// Obtenir les événements pour le mois actuel
	const getEventsForMonth = useCallback(
		(year: number, month: number) => {
			return events.filter((event) => {
				const eventDate = new Date(event.date);
				return (
					eventDate.getFullYear() === year &&
					eventDate.getMonth() === month
				);
			});
		},
		[events]
	);

	return {
		// State
		currentDate,
		view,
		events,
		// Navigation
		goToPreviousMonth,
		goToNextMonth,
		goToToday,
		setCurrentDate,
		setView,
		// Events
		addEvent,
		updateEvent,
		deleteEvent,
		getEventsForDate,
		getEventsForMonth,
	};
}

