/**
 * Composant Header pour le calendrier avec navigation
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getYear, getMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

export interface CalendarHeaderProps {
	currentMonth: Date;
	onMonthChange: (month: Date) => void;
	captionLayout?: "dropdown" | "dropdown-buttons" | "label";
	onPreviousMonth?: (e: React.MouseEvent) => void;
	onNextMonth?: (e: React.MouseEvent) => void;
}

export function CalendarHeader({
	currentMonth,
	onMonthChange,
	captionLayout = "dropdown-buttons",
	onPreviousMonth,
	onNextMonth,
}: CalendarHeaderProps) {
	const currentYear = getYear(currentMonth);
	const currentMonthIndex = getMonth(currentMonth);
	const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

	const handleMonthSelect = (monthIndex: number) => {
		const newMonth = new Date(currentMonth.getFullYear(), monthIndex, 1);
		onMonthChange(newMonth);
	};

	const handleYearSelect = (year: number) => {
		const newMonth = new Date(year, currentMonth.getMonth(), 1);
		onMonthChange(newMonth);
	};

	return (
		<div className='flex items-center justify-between mb-4'>
			{captionLayout === "dropdown-buttons" && onPreviousMonth && (
				<Button
					variant='ghost'
					size='icon'
					onClick={onPreviousMonth}
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

			{captionLayout === "dropdown" || captionLayout === "dropdown-buttons" ? (
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

			{captionLayout === "dropdown-buttons" && onNextMonth && (
				<Button
					variant='ghost'
					size='icon'
					onClick={onNextMonth}
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
	);
}


