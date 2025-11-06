/**
 * Composant Calendar complet avec gestion des vues, événements et synchronisation API
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
	format,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isSameDay,
	addDays,
	subDays,
	addMonths,
	subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { CalendarEvent, CalendarView } from "@/widgets/Calendar/types";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { calculateModifiers, getModifiersClassNames } from "./calendar/CalendarModifiers";
import { formatDateLocal } from "@/lib/utils";
import { DatePicker, type DatePickerProps } from "./calendar/DatePicker";

// Ré-exporter DatePicker pour compatibilité
export { DatePicker, type DatePickerProps };

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

	// Communication inter-widgets : Todos avec deadlines
	todosWithDeadlines?: Array<{
		id: string;
		title: string;
		deadline: string;
		listName?: string;
	}>;
}

export function Calendar({
	currentDate: controlledCurrentDate,
	onDateChange,
	selectedDate: controlledSelectedDate,
	onSelectDate,
	view: controlledView,
	todosWithDeadlines,
	onViewChange: _onViewChange,
	events = [],
	getEventsForDate: externalGetEventsForDate,
	onEventClick,
	onEventUpdate,
	onSync: _onSync,
	syncLoading: _syncLoading = false,
	className,
	showOutsideDays = true,
	captionLayout = "dropdown-buttons",
}: CalendarProps) {
	// État interne si non contrôlé
	const [internalCurrentDate, setInternalCurrentDate] = useState<Date>(
		new Date()
	);
	const [internalSelectedDate, setInternalSelectedDate] = useState<
		Date | undefined
	>(undefined);
	const [internalView] = useState<CalendarView>("month");
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

	// Modifiers pour le calendrier (dates avec événements et todos avec deadlines)
	const modifiers = useMemo(
		() => calculateModifiers(events, todosWithDeadlines),
		[events, todosWithDeadlines]
	);

	const modifiersClassNames = useMemo(() => getModifiersClassNames(), []);

	// État pour la vue mois
	const [currentMonth, setCurrentMonth] = useState<Date>(currentDate);

	useEffect(() => {
		setCurrentMonth(currentDate);
	}, [currentDate]);

	// Vue Mois
	const renderMonthView = () => {
		const handleMonthChange = (newMonth: Date) => {
			setCurrentMonth(newMonth);
			handleDateChange(newMonth);
		};

		const handlePreviousMonth = (e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			const newMonth = subMonths(currentMonth, 1);
			handleMonthChange(newMonth);
		};

		const handleNextMonth = (e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			const newMonth = addMonths(currentMonth, 1);
			handleMonthChange(newMonth);
		};

		const handleDayClick = (day: Date) => {
			handleSelectDate(day);
		};

		return (
			<div className={cn("group/calendar p-3 w-fit", className)}>
				<CalendarHeader
					currentMonth={currentMonth}
					onMonthChange={handleMonthChange}
					captionLayout={captionLayout}
					onPreviousMonth={handlePreviousMonth}
					onNextMonth={handleNextMonth}
				/>
				<CalendarGrid
					currentMonth={currentMonth}
					selectedDate={selectedDate}
					onDayClick={handleDayClick}
					showOutsideDays={showOutsideDays}
					modifiers={modifiers}
					modifiersClassNames={modifiersClassNames}
				/>
			</div>
		);
	};

	// Vue Semaine
	const renderWeekView = () => {
		try {
			if (isNaN(currentDate.getTime())) {
				return (
					<div className='p-4 text-center text-muted-foreground'>
						Date invalide
					</div>
				);
			}

			const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
			const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
			const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

			const handlePreviousWeek = () => {
				handleDateChange(subDays(currentDate, 7));
			};

			const handleNextWeek = () => {
				handleDateChange(addDays(currentDate, 7));
			};

			const weekDaysNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

			return (
				<div className='space-y-2'>
					{/* Header avec navigation */}
					<div className='flex items-center justify-between mb-4'>
						<Button
							variant='ghost'
							size='icon'
							onClick={handlePreviousWeek}
							aria-label='Semaine précédente'
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<ChevronLeft className='h-4 w-4' />
						</Button>
						<div className='text-sm font-medium'>
							{format(weekStart, "d MMM", { locale: fr })} -{" "}
							{format(weekEnd, "d MMM yyyy", { locale: fr })}
						</div>
						<Button
							variant='ghost'
							size='icon'
							onClick={handleNextWeek}
							aria-label='Semaine suivante'
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<ChevronRight className='h-4 w-4' />
						</Button>
					</div>

					{/* Grille de la semaine */}
					<div className='grid grid-cols-7 gap-1'>
						{weekDays.map((day, index) => {
							const dayEvents = getEventsForDate(day);
							const isSelected = selectedDate && isSameDay(day, selectedDate);

							const handleDragOver = (e: React.DragEvent) => {
								if (draggedEventId) {
									e.preventDefault();
									e.stopPropagation();
								}
							};

							const handleDrop = (e: React.DragEvent) => {
								if (draggedEventId) {
									e.preventDefault();
									e.stopPropagation();
									handleEventDrop(day);
									handleSelectDate(day);
								}
							};

							return (
								<div
									key={day.toISOString()}
									className={cn(
										"border rounded-md p-2 min-h-[120px] transition-colors",
										isSelected && "bg-primary/10 border-primary"
									)}
									onDragOver={handleDragOver}
									onDrop={handleDrop}
								>
									<button
										type='button'
										onClick={() => handleSelectDate(day)}
										className={cn(
											"text-sm font-medium mb-1 w-full text-left",
											isSameDay(day, new Date()) && "text-primary font-bold"
										)}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
									>
										{weekDaysNames[index]}
										<br />
										<span
											className={cn(
												"text-lg",
												isSameDay(day, new Date()) && "text-primary"
											)}
										>
											{day.getDate()}
										</span>
									</button>
									<div className='space-y-1 mt-1'>
										{dayEvents.slice(0, 3).map((event) => (
											<motion.div
												key={event.id}
												draggable
												onDragStart={(e: React.DragEvent) => {
													try {
														e.stopPropagation();
														e.dataTransfer.effectAllowed = "move";
														handleEventDragStart(event.id);
													} catch (error) {
														// Ignorer les erreurs d'extensions de navigateur
														logger.warn(
															"Erreur lors du drag start (peut être causée par une extension):",
															error
														);
													}
												}}
												onDragEnd={(e: React.DragEvent) => {
													try {
														e.stopPropagation();
														handleEventDragEnd();
													} catch (error) {
														// Ignorer les erreurs d'extensions de navigateur
														logger.warn(
															"Erreur lors du drag end (peut être causée par une extension):",
															error
														);
													}
												}}
												onClick={(e: React.MouseEvent) => {
													e.stopPropagation();
													onEventClick?.(event);
												}}
												className={cn(
													"text-xs p-1 rounded cursor-move truncate",
													"hover:opacity-80 transition-opacity",
													draggedEventId === event.id && "opacity-50"
												)}
												style={{
													backgroundColor: event.color
														? `${event.color}20`
														: "hsl(var(--primary) / 0.2)",
													borderLeft: `3px solid ${
														event.color || "hsl(var(--primary))"
													}`,
												}}
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
											>
												{event.time && (
													<span className='font-medium'>{event.time} </span>
												)}
												<span className='flex-1'>{event.title}</span>
												{event.sourceCalendar && (
													<span className='text-[9px] text-muted-foreground px-1 bg-background rounded ml-1'>
														{event.sourceCalendar}
													</span>
												)}
											</motion.div>
										))}
										{dayEvents.length > 3 && (
											<div className='text-xs text-muted-foreground'>
												+{dayEvents.length - 3} autre(s)
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			);
		} catch (error) {
			logger.error("Erreur dans WeekView:", error);
			return (
				<div className='p-4 text-center text-muted-foreground'>
					Erreur lors de l'affichage de la vue semaine
				</div>
			);
		}
	};

	// Vue Jour
	const renderDayView = () => {
		try {
			const displayDate = selectedDate || currentDate;
			if (isNaN(displayDate.getTime())) {
				return (
					<div className='p-4 text-center text-muted-foreground'>
						Date invalide
					</div>
				);
			}

			const dayEvents = getEventsForDate(displayDate).sort((a, b) => {
				if (!a.time && !b.time) return 0;
				if (!a.time) return 1;
				if (!b.time) return -1;
				return a.time.localeCompare(b.time);
			});

			const handlePreviousDay = () => {
				const prevDay = subDays(displayDate, 1);
				handleDateChange(prevDay);
				handleSelectDate(prevDay);
			};

			const handleNextDay = () => {
				const nextDay = addDays(displayDate, 1);
				handleDateChange(nextDay);
				handleSelectDate(nextDay);
			};

			const hours = Array.from({ length: 24 }, (_, i) => i);

			const handleDayDrop = (e: React.DragEvent) => {
				if (draggedEventId) {
					e.preventDefault();
					e.stopPropagation();
					try {
						const containerRect = (
							e.currentTarget as HTMLElement
						).getBoundingClientRect();
						const dropY = e.clientY - containerRect.top;
						const totalMinutes = Math.max(
							0,
							Math.min(1439, Math.round((dropY / 64) * 60))
						);
						const newHours = Math.floor(totalMinutes / 60);
						const newMins = totalMinutes % 60;
						const newTime = `${String(newHours).padStart(2, "0")}:${String(
							newMins
						).padStart(2, "0")}`;

						handleEventDrop(displayDate, newTime);
					} catch (error) {
						toast.error("Erreur lors du changement d'heure");
						logger.error("Erreur dragDrop time:", error);
					}
				}
			};

			return (
				<div className='space-y-4'>
					{/* Header avec navigation */}
					<div className='flex items-center justify-between'>
						<Button
							variant='ghost'
							size='icon'
							onClick={handlePreviousDay}
							aria-label='Jour précédent'
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<ChevronLeft className='h-4 w-4' />
						</Button>
						<div className='text-lg font-medium'>
							{format(displayDate, "EEEE d MMMM yyyy", { locale: fr })}
						</div>
						<Button
							variant='ghost'
							size='icon'
							onClick={handleNextDay}
							aria-label='Jour suivant'
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<ChevronRight className='h-4 w-4' />
						</Button>
					</div>

					{/* Agenda horaire */}
					<div className='border rounded-md overflow-hidden'>
						<div className='grid grid-cols-[80px_1fr]'>
							{/* Colonne des heures */}
							<div className='border-r'>
								{hours.map((hour) => (
									<div
										key={hour}
										className='border-b h-16 p-2 text-xs text-muted-foreground'
									>
										{hour.toString().padStart(2, "0")}:00
									</div>
								))}
							</div>

							{/* Colonne des événements */}
							<div
								className='relative'
								onDragOver={(e: React.DragEvent) => {
									if (draggedEventId) {
										e.preventDefault();
										e.stopPropagation();
									}
								}}
								onDrop={handleDayDrop}
							>
								{hours.map((hour) => (
									<div key={hour} className='border-b h-16 p-1 relative' />
								))}
								{dayEvents.map((event) => {
									if (!event.time) return null;
									const [hours, minutes] = event.time.split(":").map(Number);
									const top = (hours * 60 + minutes) * (64 / 60);

									return (
										<motion.div
											key={event.id}
											draggable
											onDragStart={(e: React.DragEvent) => {
												try {
													e.stopPropagation();
													e.dataTransfer.effectAllowed = "move";
													handleEventDragStart(event.id);
												} catch (error) {
													// Ignorer les erreurs d'extensions de navigateur
													logger.warn(
														"Erreur lors du drag start (peut être causée par une extension):",
														error
													);
												}
											}}
											onDragEnd={(e: React.DragEvent) => {
												try {
													e.stopPropagation();
													handleEventDragEnd();
												} catch (error) {
													// Ignorer les erreurs d'extensions de navigateur
													logger.warn(
														"Erreur lors du drag end (peut être causée par une extension):",
														error
													);
												}
											}}
											onClick={() => onEventClick?.(event)}
											className={cn(
												"absolute left-1 right-1 p-2 rounded-md cursor-move",
												"hover:opacity-90 transition-opacity shadow-sm",
												draggedEventId === event.id && "opacity-50 z-50"
											)}
											style={{
												top: `${top}px`,
												backgroundColor: event.color
													? `${event.color}20`
													: "hsl(var(--primary) / 0.2)",
												borderLeft: `4px solid ${
													event.color || "hsl(var(--primary))"
												}`,
											}}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
										>
											<div className='font-medium text-sm'>{event.title}</div>
											<div className='flex items-center gap-2 flex-wrap mt-1'>
												{event.time && (
													<div className='text-xs text-muted-foreground'>
														{event.time}
													</div>
												)}
												{event.sourceCalendar && (
													<span className='text-[9px] text-muted-foreground px-1.5 py-0.5 bg-background rounded border'>
														{event.sourceCalendar}
													</span>
												)}
											</div>
										</motion.div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			);
		} catch (error) {
			logger.error("Erreur dans DayView:", error);
			return (
				<div className='p-4 text-center text-muted-foreground'>
					Erreur lors de l'affichage de la vue jour
				</div>
			);
		}
	};

	return (
		<div className={cn("space-y-4", className)}>
			{view === "month" && renderMonthView()}
			{view === "week" && renderWeekView()}
			{view === "day" && renderDayView()}
		</div>
	);
}
