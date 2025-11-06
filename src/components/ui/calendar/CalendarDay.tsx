/**
 * Composant pour une cellule de jour dans le calendrier
 */

import { format, isSameMonth, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarModifiers } from "./CalendarModifiers";

export interface CalendarDayProps {
	day: Date;
	currentMonth: Date;
	selectedDate?: Date;
	onClick?: (day: Date) => void;
	showOutsideDays?: boolean;
	modifiers?: CalendarModifiers;
	modifiersClassNames?: Record<string, string> | { hasEvents: string; hasTodos: string };
}

export function CalendarDay({
	day,
	currentMonth,
	selectedDate,
	onClick,
	showOutsideDays = true,
	modifiers,
	modifiersClassNames,
}: CalendarDayProps) {
	const isOutsideMonth = !isSameMonth(day, currentMonth);
	const isDaySelected = selectedDate && isSameDay(day, selectedDate);
	const isDayToday = isSameDay(day, new Date());

	if (!showOutsideDays && isOutsideMonth) {
		return <div key={day.toISOString()} className='p-2' />;
	}

	// Vérifier si la date est dans le passé
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dayToCheck = new Date(day);
	dayToCheck.setHours(0, 0, 0, 0);
	const isPast = dayToCheck < today;

	// Calculer les classes des modifiers
	const dayModifiers: string[] = [];
	if (modifiers) {
		if (modifiers.hasEvents(day)) {
			dayModifiers.push("hasEvents");
		}
		if (modifiers.hasTodos(day)) {
			dayModifiers.push("hasTodos");
		}
	}

	const dayClassName = dayModifiers
		.map((modifier) => {
			const classNames = modifiersClassNames as Record<string, string> | undefined;
			return classNames?.[modifier];
		})
		.filter(Boolean)
		.join(" ");

	return (
		<Button
			key={day.toISOString()}
			variant='ghost'
			size='icon'
			className={cn(
				"h-9 w-9 p-0 font-normal",
				isOutsideMonth && "text-muted-foreground opacity-50",
				isPast && "opacity-60",
				isDaySelected &&
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
				isDayToday &&
					!isDaySelected &&
					"bg-primary/30 text-primary-foreground hover:bg-primary/40",
				dayClassName
			)}
			onClick={() => onClick?.(day)}
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
}

