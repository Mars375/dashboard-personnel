// src/widgets/Calendar/CalendarWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useCalendar } from "@/hooks/useCalendar";
import { useState } from "react";
import { Plus, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "./types";

export function CalendarWidget() {
	const {
		currentDate,
		setCurrentDate,
		goToToday,
		getEventsForDate,
		events,
		addEvent,
		deleteEvent,
	} = useCalendar();

	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		currentDate
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newEventDate, setNewEventDate] = useState<Date | undefined>(
		selectedDate
	);
	const [newEventTitle, setNewEventTitle] = useState("");
	const [newEventTime, setNewEventTime] = useState("");
	const [newEventDescription, setNewEventDescription] = useState("");

	// Obtenir les dates qui ont des événements pour les marquer visuellement
	const datesWithEvents = events.map((event) => new Date(event.date));

	// Modifier les jours du calendrier pour afficher le nombre d'événements
	const modifiers = {
		hasEvents: datesWithEvents,
	};

	const modifiersClassNames = {
		hasEvents:
			"relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
	};

	const handleSelect = (date: Date | undefined) => {
		setSelectedDate(date);
		if (date) {
			setCurrentDate(date);
			setNewEventDate(date);
		}
	};

	const handleCreateEvent = () => {
		if (!newEventDate || !newEventTitle.trim()) {
			return;
		}

		addEvent({
			title: newEventTitle.trim(),
			date: newEventDate.toISOString().split("T")[0], // YYYY-MM-DD
			time: newEventTime || undefined,
			description: newEventDescription || undefined,
		});

		// Reset form
		setNewEventTitle("");
		setNewEventTime("");
		setNewEventDescription("");
		setNewEventDate(selectedDate);
		setIsDialogOpen(false);
	};

	const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

	return (
		<Card className='w-full max-w-md p-4 flex flex-col gap-4'>
			{/* En-tête */}
			<div className='flex items-center justify-between'>
				<h2 className='text-lg font-semibold'>Calendrier</h2>
				<div className='flex gap-2'>
					<Button variant='secondary' size='sm' onClick={goToToday}>
						Aujourd'hui
					</Button>
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button variant='default' size='sm'>
								<Plus className='h-4 w-4 mr-1' />
								Événement
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Nouvel événement</DialogTitle>
							</DialogHeader>
							<div className='flex flex-col gap-4 py-4'>
								{/* Titre */}
								<div className='flex flex-col gap-2'>
									<Label htmlFor='event-title'>Titre *</Label>
									<Input
										id='event-title'
										value={newEventTitle}
										onChange={(e) => setNewEventTitle(e.target.value)}
										placeholder="Nom de l'événement"
									/>
								</div>

								{/* Date */}
								<div className='flex flex-col gap-2'>
									<Label>Date *</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant='outline'
												className='w-full justify-start text-left font-normal'
											>
												<CalendarIcon className='mr-2 h-4 w-4' />
												{newEventDate ? (
													format(newEventDate, "PPP", { locale: fr })
												) : (
													<span>Sélectionner une date</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className='w-auto p-0' align='start'>
											<CalendarComponent
												mode='single'
												selected={newEventDate}
												onSelect={setNewEventDate}
												initialFocus
												captionLayout='dropdown'
											/>
										</PopoverContent>
									</Popover>
								</div>

								{/* Heure */}
								<div className='flex flex-col gap-2'>
									<Label htmlFor='event-time'>Heure (optionnel)</Label>
									<div className='relative'>
										<Clock className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
										<Input
											id='event-time'
											type='time'
											value={newEventTime}
											onChange={(e) => setNewEventTime(e.target.value)}
											className='pl-8'
										/>
									</div>
								</div>

								{/* Description */}
								<div className='flex flex-col gap-2'>
									<Label htmlFor='event-description'>
										Description (optionnel)
									</Label>
									<Input
										id='event-description'
										value={newEventDescription}
										onChange={(e) => setNewEventDescription(e.target.value)}
										placeholder="Description de l'événement"
									/>
								</div>

								{/* Boutons */}
								<div className='flex justify-end gap-2 mt-2'>
									<Button
										variant='outline'
										onClick={() => setIsDialogOpen(false)}
									>
										Annuler
									</Button>
									<Button
										onClick={handleCreateEvent}
										disabled={!newEventDate || !newEventTitle.trim()}
									>
										Créer
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Calendrier shadcn/ui */}
			<div className='flex justify-center'>
				<CalendarComponent
					mode='single'
					selected={selectedDate}
					onSelect={handleSelect}
					defaultMonth={currentDate}
					modifiers={modifiers}
					modifiersClassNames={modifiersClassNames}
					className='rounded-md border shadow-sm'
					captionLayout='dropdown'
				/>
			</div>

			{/* Zone d'affichage des événements du jour sélectionné */}
			{selectedDate && (
				<div className='mt-4 p-3 border rounded-md'>
					<h3 className='text-sm font-semibold mb-2'>
						{selectedDate.toLocaleDateString("fr-FR", {
							weekday: "long",
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</h3>
					{selectedDateEvents.length === 0 ? (
						<p className='text-sm text-muted-foreground'>Aucun événement</p>
					) : (
						<div className='space-y-2'>
							{selectedDateEvents.map((event) => (
								<CalendarEventItem
									key={event.id}
									event={event}
									onDelete={() => deleteEvent(event.id)}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</Card>
	);
}

// Composant pour afficher un événement
function CalendarEventItem({
	event,
	onDelete,
}: {
	event: CalendarEvent;
	onDelete: () => void;
}) {
	return (
		<div className='text-sm p-2 bg-accent rounded flex items-start justify-between gap-2'>
			<div className='flex-1'>
				<div className='font-medium'>{event.title}</div>
				{event.time && (
					<div className='text-muted-foreground text-xs flex items-center gap-1'>
						<Clock className='h-3 w-3' />
						{event.time}
					</div>
				)}
				{event.description && (
					<div className='text-muted-foreground text-xs mt-1'>
						{event.description}
					</div>
				)}
			</div>
			<Button
				variant='ghost'
				size='icon'
				className='h-6 w-6'
				onClick={onDelete}
				aria-label="Supprimer l'événement"
			>
				×
			</Button>
		</div>
	);
}
