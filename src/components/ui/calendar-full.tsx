/**
 * Composant Calendar complet avec gestion des vues, événements et synchronisation API
 */

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CalendarEvent, CalendarView } from "@/widgets/Calendar/types";
// Les composants de vue seront créés ensuite
// import { CalendarMonthView } from "./CalendarMonthView";
// import { CalendarWeekView } from "./CalendarWeekView";
// import { CalendarDayView } from "./CalendarDayView";

export interface CalendarProps {
	// État du calendrier
	currentDate?: Date;
	onDateChange?: (date: Date) => void;
	selectedDate?: Date;
	onSelectDate?: (date: Date | undefined) => void;
	view?: CalendarView;
	onViewChange?: (view: CalendarView) => void;

	// Événements
	events?: CalendarEvent[];
	getEventsForDate?: (date: Date) => CalendarEvent[];
	onEventClick?: (event: CalendarEvent) => void;
	onEventCreate?: (date: Date) => void;
	onEventUpdate?: (id: string, updates: Partial<CalendarEvent>) => void;
	onEventDelete?: (id: string) => void;

	// Synchronisation
	onSync?: () => Promise<void>;
	syncLoading?: boolean;

	// Configuration
	className?: string;
	showOutsideDays?: boolean;
	captionLayout?: "dropdown" | "dropdown-buttons" | "label";
}

function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function Calendar({
	currentDate: controlledCurrentDate,
	onDateChange,
	selectedDate: controlledSelectedDate,
	onSelectDate,
	view: controlledView,
	onViewChange,
	events = [],
	getEventsForDate: externalGetEventsForDate,
	onEventClick,
	onEventCreate,
	onEventUpdate,
	onEventDelete,
	onSync,
	syncLoading = false,
	className,
	showOutsideDays = true,
	captionLayout = "dropdown-buttons",
}: CalendarProps) {
	// État interne si non contrôlé
	const [internalCurrentDate, setInternalCurrentDate] = useState<Date>(new Date());
	const [internalSelectedDate, setInternalSelectedDate] = useState<Date | undefined>(undefined);
	const [internalView, setInternalView] = useState<CalendarView>("month");
	const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

	// Utiliser état contrôlé ou interne
	const currentDate = controlledCurrentDate ?? internalCurrentDate;
	const selectedDate = controlledSelectedDate ?? internalSelectedDate;
	const view = controlledView ?? internalView;

	const handleDateChange = useCallback(
		(date: Date) => {
			if (!controlledCurrentDate) {
				setInternalCurrentDate(date);
			}
			onDateChange?.(date);
		},
		[controlledCurrentDate, onDateChange]
	);

	const handleSelectDate = useCallback(
		(date: Date | undefined) => {
			if (!controlledSelectedDate) {
				setInternalSelectedDate(date);
			}
			onSelectDate?.(date);
		},
		[controlledSelectedDate, onSelectDate]
	);

	const handleViewChange = useCallback(
		(newView: CalendarView) => {
			if (!controlledView) {
				setInternalView(newView);
			}
			onViewChange?.(newView);
		},
		[controlledView, onViewChange]
	);

	// Fonction pour récupérer les événements d'une date
	const getEventsForDate = useCallback(
		(date: Date): CalendarEvent[] => {
			if (externalGetEventsForDate) {
				return externalGetEventsForDate(date);
			}
			const dateStr = formatDateLocal(date);
			return events.filter((event) => event.date === dateStr);
		},
		[events, externalGetEventsForDate]
	);

	// Handlers pour drag & drop
	const handleEventDragStart = useCallback((eventId: string) => {
		setDraggedEventId(eventId);
	}, []);

	const handleEventDragEnd = useCallback(() => {
		setDraggedEventId(null);
	}, []);

	const handleEventDrop = useCallback(
		(date: Date, time?: string) => {
			if (!draggedEventId || !onEventUpdate) return;

			const updates: Partial<CalendarEvent> = {
				date: formatDateLocal(date),
			};

			if (time) {
				updates.time = time;
			}

			onEventUpdate(draggedEventId, updates);
			toast.success("Événement déplacé");
			setDraggedEventId(null);
		},
		[draggedEventId, onEventUpdate]
	);

	// Modifiers pour le calendrier (dates avec événements)
	const modifiers = useMemo(() => {
		const eventDates = new Set(events.map((e) => e.date));
		return {
			hasEvents: (date: Date) => eventDates.has(formatDateLocal(date)),
		};
	}, [events]);

	const modifiersClassNames = useMemo(
		() => ({
			hasEvents: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
		}),
		[]
	);

	return (
		<div className={cn("space-y-4", className)}>
			{/* TODO: Implémenter les vues mois/semaine/jour */}
			{view === "month" && (
				<div className="p-4 text-center text-muted-foreground">
					Vue mois à implémenter
				</div>
			)}

			{view === "week" && (
				<div className="p-4 text-center text-muted-foreground">
					Vue semaine à implémenter
				</div>
			)}

			{view === "day" && (
				<div className="p-4 text-center text-muted-foreground">
					Vue jour à implémenter
				</div>
			)}
		</div>
	);
}

