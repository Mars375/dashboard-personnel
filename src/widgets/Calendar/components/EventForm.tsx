/**
 * Composant EventForm - Formulaire d'ajout/édition d'événement
 * Extrait de CalendarWidget pour améliorer la maintenabilité
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/calendar-full";
import { CalendarIcon, Clock, Bell, Repeat } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "../types";

interface EventFormProps {
	editingEvent: CalendarEvent | null;
	newEventTitle: string;
	newEventDate: Date | undefined;
	newEventEndDate: Date | undefined;
	newEventTime: string;
	newEventEndTime: string;
	newEventDescription: string;
	newEventColor: string;
	newEventRecurrence: "none" | "daily" | "weekly" | "monthly" | "yearly";
	newEventReminderMinutes: number | undefined;
	eventColors: Array<{ name: string; value: string; class: string }>;
	onTitleChange: (value: string) => void;
	onDateChange: (date: Date | undefined) => void;
	onEndDateChange: (date: Date | undefined) => void;
	onTimeChange: (value: string) => void;
	onEndTimeChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onColorChange: (value: string) => void;
	onRecurrenceChange: (
		value: "none" | "daily" | "weekly" | "monthly" | "yearly"
	) => void;
	onReminderChange: (value: number | undefined) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

function EventFormComponent({
	editingEvent,
	newEventTitle,
	newEventDate,
	newEventEndDate,
	newEventTime,
	newEventEndTime,
	newEventDescription,
	newEventColor,
	newEventRecurrence,
	newEventReminderMinutes,
	eventColors,
	onTitleChange,
	onDateChange,
	onEndDateChange,
	onTimeChange,
	onEndTimeChange,
	onDescriptionChange,
	onColorChange,
	onRecurrenceChange,
	onReminderChange,
	onSubmit,
	onCancel,
}: EventFormProps) {
	return (
		<div className="flex flex-col gap-4 py-4">
			{/* Titre */}
			<div className="flex flex-col gap-2">
				<Label htmlFor="event-title">Titre *</Label>
				<Input
					id="event-title"
					value={newEventTitle}
					onChange={(e) => onTitleChange(e.target.value)}
					placeholder="Nom de l'événement"
				/>
			</div>

			{/* Date de début */}
			<div className="flex flex-col gap-2">
				<Label>Date de début *</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-start text-left font-normal"
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{newEventDate ? (
								format(newEventDate, "PPP", { locale: fr })
							) : (
								<span>Sélectionner une date</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<DatePicker
							selected={newEventDate}
							onSelect={onDateChange}
							captionLayout="dropdown"
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Date de fin */}
			<div className="flex flex-col gap-2">
				<Label>
					Date de fin (optionnel - pour événements multi-jours)
				</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-start text-left font-normal"
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{newEventEndDate ? (
								format(newEventEndDate, "PPP", { locale: fr })
							) : (
								<span>Sélectionner une date de fin</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<DatePicker
							selected={newEventEndDate}
							onSelect={onEndDateChange}
							captionLayout="dropdown"
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Heure de début */}
			<div className="flex flex-col gap-2">
				<Label htmlFor="event-time">Heure de début (optionnel)</Label>
				<div className="relative">
					<Clock className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="event-time"
						type="time"
						value={newEventTime}
						onChange={(e) => onTimeChange(e.target.value)}
						className="pl-8"
					/>
				</div>
			</div>

			{/* Heure de fin */}
			<div className="flex flex-col gap-2">
				<Label htmlFor="event-end-time">Heure de fin (optionnel)</Label>
				<div className="relative">
					<Clock className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="event-end-time"
						type="time"
						value={newEventEndTime}
						onChange={(e) => onEndTimeChange(e.target.value)}
						className="pl-8"
					/>
				</div>
			</div>

			{/* Description */}
			<div className="flex flex-col gap-2">
				<Label htmlFor="event-description">
					Description (optionnel)
				</Label>
				<Input
					id="event-description"
					value={newEventDescription}
					onChange={(e) => onDescriptionChange(e.target.value)}
					placeholder="Description de l'événement"
				/>
			</div>

			{/* Couleur */}
			<div className="flex flex-col gap-2">
				<Label>Couleur (optionnel)</Label>
				<div className="flex flex-wrap gap-2">
					{eventColors.map((color) => (
						<button
							key={color.value}
							type="button"
							onClick={() => onColorChange(color.value)}
							className={cn(
								"h-8 w-8 rounded-full border-2 transition-all",
								color.class,
								newEventColor === color.value
									? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
									: "border-border hover:scale-105"
							)}
							title={color.name}
							aria-label={`Sélectionner la couleur ${color.name}`}
						/>
					))}
				</div>
			</div>

			{/* Répétition */}
			<div className="flex flex-col gap-2">
				<Label htmlFor="event-recurrence">
					<Repeat className="mr-2 h-4 w-4 inline" />
					Répétition (optionnel)
				</Label>
				<select
					id="event-recurrence"
					value={newEventRecurrence}
					onChange={(e) =>
						onRecurrenceChange(
							e.target.value as
								| "none"
								| "daily"
								| "weekly"
								| "monthly"
								| "yearly"
						)
					}
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="none">Aucune</option>
					<option value="daily">Quotidien</option>
					<option value="weekly">Hebdomadaire</option>
					<option value="monthly">Mensuel</option>
					<option value="yearly">Annuel</option>
				</select>
			</div>

			{/* Rappel */}
			<div className="flex flex-col gap-2">
				<Label htmlFor="event-reminder">
					<Bell className="mr-2 h-4 w-4 inline" />
					Rappel (optionnel)
				</Label>
				<select
					id="event-reminder"
					value={newEventReminderMinutes || ""}
					onChange={(e) =>
						onReminderChange(
							e.target.value === "" ? undefined : Number(e.target.value)
						)
					}
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">Aucun rappel</option>
					<option value="5">5 minutes avant</option>
					<option value="15">15 minutes avant</option>
					<option value="30">30 minutes avant</option>
					<option value="60">1 heure avant</option>
					<option value="120">2 heures avant</option>
					<option value="1440">1 jour avant</option>
				</select>
			</div>

			{/* Boutons */}
			<div className="flex justify-end gap-2 mt-2">
				<Button variant="outline" onClick={onCancel}>
					Annuler
				</Button>
				<Button
					onClick={onSubmit}
					disabled={!newEventDate || !newEventTitle.trim()}
				>
					{editingEvent ? "Enregistrer" : "Créer"}
				</Button>
			</div>
		</div>
	);
}

export const EventForm = memo(EventFormComponent);

