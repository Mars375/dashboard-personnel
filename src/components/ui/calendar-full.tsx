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
	startOfMonth,
	endOfMonth,
	isSameMonth,
	addMonths,
	subMonths,
	getYear,
	getMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { CalendarEvent, CalendarView } from "@/widgets/Calendar/types";

// Interface pour DatePicker simple (utilisé dans les Popovers)
export interface DatePickerProps {
	selected?: Date;
	onSelect?: (date: Date | undefined) => void;
	month?: Date;
	onMonthChange?: (date: Date) => void;
	className?: string;
	captionLayout?: "dropdown" | "dropdown-buttons" | "label";
	showOutsideDays?: boolean;
	initialFocus?: boolean;
}

// Composant DatePicker simple pour sélection de date dans Popovers
export function DatePicker({
	selected,
	onSelect,
	month,
	onMonthChange,
	className,
	captionLayout = "dropdown",
	showOutsideDays = true,
}: DatePickerProps) {
	const MONTHS = [
		"Janvier",
		"Février",
		"Mars",
		"Avril",
		"Mai",
		"Juin",
		"Juillet",
		"Août",
		"Septembre",
		"Octobre",
		"Novembre",
		"Décembre",
	];

	const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

	const [currentMonth, setCurrentMonth] = useState<Date>(month || new Date());

	useEffect(() => {
		if (month) {
			setCurrentMonth(month);
		}
	}, [month]);

	const handleMonthChange = (newMonth: Date) => {
		setCurrentMonth(newMonth);
		onMonthChange?.(newMonth);
	};

	const handleMonthSelect = (monthIndex: number) => {
		const newMonth = new Date(currentMonth.getFullYear(), monthIndex, 1);
		handleMonthChange(newMonth);
	};

	const handleYearSelect = (year: number) => {
		const newMonth = new Date(year, currentMonth.getMonth(), 1);
		handleMonthChange(newMonth);
	};

	const handleDayClick = (day: Date) => {
		// Empêcher la sélection des dates passées
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dayToCheck = new Date(day);
		dayToCheck.setHours(0, 0, 0, 0);

		if (dayToCheck < today) {
			return; // Ne pas permettre la sélection de dates passées
		}

		onSelect?.(day);
	};

	// Calculer les jours à afficher
	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

	const currentYear = getYear(currentMonth);
	const currentMonthIndex = getMonth(currentMonth);
	const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

	const isToday = (day: Date) => isSameDay(day, new Date());
	const isSelected = (day: Date) => selected && isSameDay(day, selected);

	return (
		<div className={cn("group/calendar p-3 w-fit", className)}>
			{/* Header avec navigation */}
			<div className='flex items-center justify-between mb-4'>
				{captionLayout === "dropdown" ||
				captionLayout === "dropdown-buttons" ? (
					<div className='flex items-center gap-1.5'>
						<Select
							value={currentMonthIndex.toString()}
							onValueChange={(value) => handleMonthSelect(Number(value))}
						>
							<SelectTrigger
								className='w-[100px] h-8 text-sm'
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MONTHS.map((month, index) => (
									<SelectItem key={index} value={index.toString()}>
										{month}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={currentYear.toString()}
							onValueChange={(value) => handleYearSelect(Number(value))}
						>
							<SelectTrigger
								className='w-[80px] h-8 text-sm'
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{years.map((year) => (
									<SelectItem key={year} value={year.toString()}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				) : (
					<div className='text-sm font-medium'>
						{format(currentMonth, "MMMM yyyy", { locale: fr })}
					</div>
				)}
			</div>

			{/* Grille du calendrier */}
			<div className='w-full'>
				{/* En-têtes des jours */}
				<div className='grid grid-cols-7 gap-1 mb-1'>
					{WEEKDAYS.map((day) => (
						<div
							key={day}
							className='text-muted-foreground text-center text-sm font-normal p-2'
						>
							{day}
						</div>
					))}
				</div>

				{/* Jours */}
				<div className='grid grid-cols-7 gap-1'>
					{days.map((day) => {
						const isOutsideMonth = !isSameMonth(day, currentMonth);
						const isDaySelected = isSelected(day);
						const isDayToday = isToday(day);

						if (!showOutsideDays && isOutsideMonth) {
							return <div key={day.toISOString()} className='p-2' />;
						}

						// Vérifier si la date est dans le passé (tous les jours, même ceux en dehors du mois)
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const dayToCheck = new Date(day);
						dayToCheck.setHours(0, 0, 0, 0);
						const isPast = dayToCheck < today;

						return (
							<Button
								key={day.toISOString()}
								variant='ghost'
								size='icon'
								className={cn(
									"h-9 w-9 p-0 font-normal",
									isOutsideMonth && "text-muted-foreground opacity-50",
									isPast && "opacity-30 cursor-not-allowed line-through",
									isDaySelected &&
										"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
									isDayToday &&
										!isDaySelected &&
										"bg-primary/30 text-primary-foreground hover:bg-primary/40"
								)}
								onClick={() => handleDayClick(day)}
								disabled={isPast}
								onMouseDown={(e: React.MouseEvent) => {
									if (isPast) {
										e.preventDefault();
										return;
									}
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									if (isPast) {
										e.preventDefault();
										return;
									}
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								{format(day, "d")}
							</Button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

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
	todosWithDeadlines,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onViewChange,
	events = [],
	getEventsForDate: externalGetEventsForDate,
	onEventClick,
	onEventUpdate,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onSync,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	syncLoading = false,
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
	const modifiers = useMemo(() => {
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
	}, [events, todosWithDeadlines]);

	const modifiersClassNames = useMemo(
		() => ({
			hasEvents:
				"relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
			hasTodos:
				"relative before:absolute before:top-1 before:right-1 before:w-1.5 before:h-1.5 before:rounded-full before:bg-orange-500",
		}),
		[]
	);

	// État pour la vue mois
	const [currentMonth, setCurrentMonth] = useState<Date>(currentDate);

	useEffect(() => {
		setCurrentMonth(currentDate);
	}, [currentDate]);

	// Vue Mois
	const renderMonthView = () => {
		const MONTHS = [
			"Janvier",
			"Février",
			"Mars",
			"Avril",
			"Mai",
			"Juin",
			"Juillet",
			"Août",
			"Septembre",
			"Octobre",
			"Novembre",
			"Décembre",
		];

		const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

		const handleMonthSelect = (monthIndex: number) => {
			const newMonth = new Date(currentMonth.getFullYear(), monthIndex, 1);
			handleMonthChange(newMonth);
		};

		const handleYearSelect = (year: number) => {
			const newMonth = new Date(year, currentMonth.getMonth(), 1);
			handleMonthChange(newMonth);
		};

		const handleDayClick = (day: Date) => {
			handleSelectDate(day);
		};

		// Calculer les jours à afficher
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(currentMonth);
		const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

		const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

		const currentYear = getYear(currentMonth);
		const currentMonthIndex = getMonth(currentMonth);
		const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

		const isToday = (day: Date) => isSameDay(day, new Date());
		const isSelected = (day: Date) =>
			selectedDate && isSameDay(day, selectedDate);

		const getDayModifiers = (day: Date) => {
			const dayModifiers: string[] = [];
			const modifiersKeys = Object.keys(modifiers) as Array<
				keyof typeof modifiers
			>;
			modifiersKeys.forEach((key) => {
				const modifier = modifiers[key];
				if (Array.isArray(modifier)) {
					const dayStr = formatDateLocal(day);
					if (modifier.some((d) => formatDateLocal(d) === dayStr)) {
						dayModifiers.push(key);
					}
				} else if (typeof modifier === "function") {
					if (modifier(day)) {
						dayModifiers.push(key);
					}
				}
			});
			return dayModifiers;
		};

		const getDayClassName = (day: Date) => {
			const dayModifiers = getDayModifiers(day);
			const classes: string[] = [];

			if (isToday(day) && !isSelected(day)) {
				classes.push("bg-primary/30", "text-primary-foreground");
			}

			if (isSelected(day)) {
				classes.push("bg-primary", "text-primary-foreground");
			}

			dayModifiers.forEach((modifier) => {
				const classNames = modifiersClassNames as Record<string, string>;
				if (classNames[modifier]) {
					classes.push(classNames[modifier]);
				}
			});

			return classes;
		};

		return (
			<div className={cn("group/calendar p-3 w-fit", className)}>
				{/* Header avec navigation */}
				<div className='flex items-center justify-between mb-4'>
					{captionLayout === "dropdown-buttons" && (
						<Button
							variant='ghost'
							size='icon'
							onClick={handlePreviousMonth}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							aria-label='Mois précédent'
						>
							<ChevronLeft className='h-4 w-4' />
						</Button>
					)}

					{captionLayout === "dropdown" ||
					captionLayout === "dropdown-buttons" ? (
						<div className='flex items-center gap-1.5'>
							<Select
								value={currentMonthIndex.toString()}
								onValueChange={(value) => handleMonthSelect(Number(value))}
							>
								<SelectTrigger
									className='w-[100px] h-8 text-sm'
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{MONTHS.map((month, index) => (
										<SelectItem key={index} value={index.toString()}>
											{month}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={currentYear.toString()}
								onValueChange={(value) => handleYearSelect(Number(value))}
							>
								<SelectTrigger
									className='w-[80px] h-8 text-sm'
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{years.map((year) => (
										<SelectItem key={year} value={year.toString()}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : (
						<div className='text-sm font-medium'>
							{format(currentMonth, "MMMM yyyy", { locale: fr })}
						</div>
					)}

					{captionLayout === "dropdown-buttons" && (
						<Button
							variant='ghost'
							size='icon'
							onClick={handleNextMonth}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							aria-label='Mois suivant'
						>
							<ChevronRight className='h-4 w-4' />
						</Button>
					)}
				</div>

				{/* Grille du calendrier */}
				<div className='w-full'>
					{/* En-têtes des jours */}
					<div className='grid grid-cols-7 gap-1 mb-1'>
						{WEEKDAYS.map((day) => (
							<div
								key={day}
								className='text-muted-foreground text-center text-sm font-normal p-2'
							>
								{day}
							</div>
						))}
					</div>

					{/* Jours */}
					<div className='grid grid-cols-7 gap-1'>
						{days.map((day) => {
							const isOutsideMonth = !isSameMonth(day, currentMonth);
							const isDaySelected = isSelected(day);
							const isDayToday = isToday(day);
							const dayClassName = getDayClassName(day);

							if (!showOutsideDays && isOutsideMonth) {
								return <div key={day.toISOString()} className='p-2' />;
							}

							return (
								<Button
									key={day.toISOString()}
									variant='ghost'
									size='icon'
									className={cn(
										"h-9 w-9 p-0 font-normal",
										isOutsideMonth && "text-muted-foreground opacity-50",
										isDaySelected &&
											"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
										isDayToday &&
											!isDaySelected &&
											"bg-primary/30 text-primary-foreground hover:bg-primary/40",
										dayClassName
									)}
									onClick={() => handleDayClick(day)}
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									{format(day, "d")}
								</Button>
							);
						})}
					</div>
				</div>
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
