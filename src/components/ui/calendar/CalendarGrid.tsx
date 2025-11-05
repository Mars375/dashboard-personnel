/**
 * Composant pour la grille du calendrier (vue mois)
 */

import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { CalendarDay } from "./CalendarDay";
import type { CalendarModifiers } from "./CalendarModifiers";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export interface CalendarGridProps {
	currentMonth: Date;
	selectedDate?: Date;
	onDayClick?: (day: Date) => void;
	showOutsideDays?: boolean;
	modifiers?: CalendarModifiers;
	modifiersClassNames?: Record<string, string> | { hasEvents: string; hasTodos: string };
}

export function CalendarGrid({
	currentMonth,
	selectedDate,
	onDayClick,
	showOutsideDays = true,
	modifiers,
	modifiersClassNames,
}: CalendarGridProps) {
	// Calculer les jours à afficher
	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

	return (
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
				{days.map((day) => (
					<CalendarDay
						key={day.toISOString()}
						day={day}
						currentMonth={currentMonth}
						selectedDate={selectedDate}
						onClick={onDayClick}
						showOutsideDays={showOutsideDays}
						modifiers={modifiers}
						modifiersClassNames={modifiersClassNames}
					/>
				))}
			</div>
		</div>
	);
}

