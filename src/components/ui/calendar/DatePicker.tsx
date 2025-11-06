/**
 * Composant DatePicker simple pour sélection de date dans Popovers
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";

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

/**
 * Composant DatePicker simple pour sélection de date dans Popovers
 */
export function DatePicker({
	selected,
	onSelect,
	month,
	onMonthChange,
	className,
	captionLayout = "dropdown",
	showOutsideDays = true,
}: DatePickerProps) {
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

	const handleDayClick = (day: Date) => {
		// Empêcher la sélection des dates passées dans les DatePickers
		// (utilisés pour créer/modifier des événements, deadlines, etc.)
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dayToCheck = new Date(day);
		dayToCheck.setHours(0, 0, 0, 0);

		if (dayToCheck < today) {
			return; // Ne pas permettre la sélection de dates passées
		}

		onSelect?.(day);
	};

	return (
		<div className={cn("group/calendar p-3 w-fit", className)}>
			<CalendarHeader
				currentMonth={currentMonth}
				onMonthChange={handleMonthChange}
				captionLayout={captionLayout}
			/>
			<CalendarGrid
				currentMonth={currentMonth}
				selectedDate={selected}
				onDayClick={handleDayClick}
				showOutsideDays={showOutsideDays}
			/>
		</div>
	);
}

