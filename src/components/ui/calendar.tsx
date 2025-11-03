import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isSameMonth,
	isSameDay,
	addMonths,
	subMonths,
	getYear,
	getMonth,
} from "date-fns";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface CalendarProps {
	selected?: Date;
	onSelect?: (date: Date | undefined) => void;
	month?: Date;
	onMonthChange?: (date: Date) => void;
	modifiers?: {
		[key: string]: ((date: Date) => boolean) | Date[];
	};
	modifiersClassNames?: {
		[key: string]: string;
	};
	className?: string;
	captionLayout?: "dropdown" | "dropdown-buttons" | "label";
	showOutsideDays?: boolean;
	initialFocus?: boolean;
}

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

export function Calendar({
	selected,
	onSelect,
	month,
	onMonthChange,
	modifiers = {},
	modifiersClassNames = {},
	className,
	captionLayout = "dropdown",
	showOutsideDays = true,
}: CalendarProps) {
	const [currentMonth, setCurrentMonth] = React.useState<Date>(
		month || new Date()
	);

	React.useEffect(() => {
		if (month) {
			setCurrentMonth(month);
		}
	}, [month]);

	const handleMonthChange = (newMonth: Date) => {
		setCurrentMonth(newMonth);
		onMonthChange?.(newMonth);
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

	const getDayModifiers = (day: Date) => {
		const dayModifiers: string[] = [];
		Object.keys(modifiers).forEach((key) => {
			const modifier = modifiers[key];
			if (Array.isArray(modifier)) {
				// Si c'est un tableau de dates, vérifier si la date est dans le tableau
				const dayStr = formatDateLocal(day);
				if (modifier.some((d) => formatDateLocal(d) === dayStr)) {
					dayModifiers.push(key);
				}
			} else if (typeof modifier === "function") {
				// Si c'est une fonction, l'appeler
				if (modifier(day)) {
					dayModifiers.push(key);
				}
			}
		});
		return dayModifiers;
	};

	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
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
			if (modifiersClassNames[modifier]) {
				classes.push(modifiersClassNames[modifier]);
			}
		});

		return classes;
	};

	return (
		<div className={cn("bg-background group/calendar p-3 w-fit", className)}>
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
}
