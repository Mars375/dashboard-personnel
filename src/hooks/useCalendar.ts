// Hook personnalisé pour gérer le calendrier et les événements

import { useState, useCallback, useEffect } from "react";
import type { CalendarEvent, CalendarView } from "@/widgets/Calendar/types";
import {
	loadCalendarEvents,
	saveCalendarEvents,
} from "@/store/calendarStorage";
import { isDateInRecurrence } from "@/lib/calendarRecurrence";
import { logger } from "@/lib/logger";
import { formatDateLocal } from "@/lib/utils";

export function useCalendar() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState<CalendarView>("month");
	const [events, setEvents] = useState<CalendarEvent[]>([]);

	// État pour suivre si c'est le montage initial
	const [isInitialMount, setIsInitialMount] = useState(true);

	// Charger les événements au montage
	useEffect(() => {
		const loaded = loadCalendarEvents();
		logger.debug("🚀 Montage initial: Chargement de", loaded.length, "événement(s)");
		setEvents(loaded);
		setIsInitialMount(false);
	}, []);

	// Sauvegarder les événements à chaque changement (sauf au montage initial)
	useEffect(() => {
		if (isInitialMount) {
			logger.debug("⏭️ Skip sauvegarde (montage initial)");
			return;
		}
		
		logger.debug("🔄 useEffect: Sauvegarde de", events.length, "événement(s)");
		saveCalendarEvents(events);
	}, [events, isInitialMount]);

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
		(event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> | CalendarEvent) => {
			// Si l'événement a déjà un ID (ex: synchronisé depuis Google), l'utiliser
			// Sinon, générer un nouvel ID
			const hasId = "id" in event && event.id;
			const newEvent: CalendarEvent = hasId
				? {
						...event,
						createdAt: event.createdAt || new Date().toISOString(),
						updatedAt: event.updatedAt || new Date().toISOString(),
					}
				: {
						...event,
						id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
			
			setEvents((prev) => {
				// Vérifier si l'événement existe déjà pour éviter les doublons
				const exists = prev.some((e) => e.id === newEvent.id);
				if (exists) {
					return prev;
				}
				return [...prev, newEvent];
			});
			return newEvent;
		},
		[]
	);

	const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
		let updatedEvent: CalendarEvent | undefined;
		setEvents((prev) =>
			prev.map((event) => {
				if (event.id === id) {
					updatedEvent = {
						...event,
						...updates,
						updatedAt: new Date().toISOString(),
					};
					return updatedEvent;
				}
				return event;
			})
		);
		return updatedEvent;
	}, []);

	const deleteEvent = useCallback((id: string) => {
		setEvents((prev) => prev.filter((event) => event.id !== id));
	}, []);

	// Obtenir les événements pour une date spécifique
	const getEventsForDate = useCallback(
		(date: Date) => {
			return events.filter((event) => {
				// Parser les dates en évitant les problèmes de timezone
				const [startYear, startMonth, startDay] = event.date.split("-").map(Number);
				const startDate = new Date(startYear, startMonth - 1, startDay);
				startDate.setHours(0, 0, 0, 0);
				
				const checkDate = new Date(date);
				checkDate.setHours(0, 0, 0, 0);
				
				// Événement direct
				if (formatDateLocal(checkDate) === formatDateLocal(startDate)) return true;
				
				// Événement multi-jours : vérifier si la date est dans la plage
				if (event.endDate) {
					const [endYear, endMonth, endDay] = event.endDate.split("-").map(Number);
					const endDate = new Date(endYear, endMonth - 1, endDay);
					endDate.setHours(23, 59, 59, 999);
					
					if (checkDate >= startDate && checkDate <= endDate) {
						return true;
					}
				}
				
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

	// Fonction pour ajouter plusieurs événements en une seule fois
	const addEvents = useCallback((newEvents: (Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> | CalendarEvent)[]) => {
		logger.debug("➕ addEvents: Ajout de", newEvents.length, "événement(s)");
		setEvents((prev) => {
			const existingIds = new Set(prev.map((e) => e.id));
			const eventsToAdd: CalendarEvent[] = [];

			for (const event of newEvents) {
				// Si l'événement a déjà un ID (ex: synchronisé depuis Google), l'utiliser
				// Sinon, générer un nouvel ID
				const hasId = "id" in event && event.id;
				const processedEvent: CalendarEvent = hasId
					? {
							...event,
							createdAt: event.createdAt || new Date().toISOString(),
							updatedAt: event.updatedAt || new Date().toISOString(),
						}
					: {
							...event,
							id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						};

				// Vérifier si l'événement existe déjà pour éviter les doublons
				if (!existingIds.has(processedEvent.id)) {
					eventsToAdd.push(processedEvent);
					existingIds.add(processedEvent.id);
									logger.debug("  ✓ Ajouté:", processedEvent.title, "(" + processedEvent.id + ")");
				} else {
					logger.debug("  ⏭️ Ignoré (déjà présent):", processedEvent.title, "(" + processedEvent.id + ")");
				}
			}

			if (eventsToAdd.length === 0) {
				logger.debug("⚠️ Aucun événement à ajouter (tous déjà présents)");
				return prev;
			}

			const newEventsList = [...prev, ...eventsToAdd];
				logger.debug("✅ Total après ajout:", newEventsList.length, "événement(s)");
			return newEventsList;
		});
	}, []);

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
		addEvents,
		updateEvent,
		deleteEvent,
		getEventsForDate,
		getEventsForMonth,
	};
}

