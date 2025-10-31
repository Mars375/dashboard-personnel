// src/widgets/Calendar/CalendarWidget.tsx
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonGroup } from "@/components/ui/button-group";
import { useCalendar } from "@/hooks/useCalendar";
import { useTodos } from "@/hooks/useTodos";
import { useState, useEffect, useRef } from "react";
import {
	Plus,
	CalendarIcon,
	Clock,
	Edit2,
	Download,
	Upload,
	Bell,
	BellOff,
	Calendar as CalendarViewIcon,
	Grid3x3,
	List,
	RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./types";
import {
	exportCalendarToJSON,
	exportCalendarToICS,
	importCalendarFromJSON,
} from "@/lib/calendarExport";
import {
	requestNotificationPermission,
	loadNotificationSettings,
	saveNotificationSettings,
	checkAndSendNotifications,
	type CalendarNotificationSettings,
} from "@/lib/calendarNotifications";
import { calendarSyncManager } from "@/lib/sync/calendarSyncManager";

export function CalendarWidget() {
	const {
		currentDate,
		setCurrentDate,
		getEventsForDate,
		events,
		addEvent,
		updateEvent,
		deleteEvent,
		view,
		setView,
	} = useCalendar();

	const { todos } = useTodos();

	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		currentDate
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
	const [newEventDate, setNewEventDate] = useState<Date | undefined>(
		selectedDate
	);
	const [newEventTitle, setNewEventTitle] = useState("");
	const [newEventTime, setNewEventTime] = useState("");
	const [newEventDescription, setNewEventDescription] = useState("");
	const [notificationSettings, setNotificationSettings] =
		useState<CalendarNotificationSettings>(loadNotificationSettings);
	const [notificationPermission, setNotificationPermission] =
		useState<NotificationPermission>(
			typeof window !== "undefined" && "Notification" in window
				? Notification.permission
				: "denied"
		);
	const notificationNotifiedRef = useRef<Set<string>>(new Set());
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isSyncing, setIsSyncing] = useState(false);
	const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

	// Charger les todos pour afficher les deadlines
	const todosWithDeadlines = todos.filter(
		(todo) => todo.deadline && !todo.completed
	);

	// Obtenir les dates qui ont des événements pour les marquer visuellement
	const datesWithEvents = events.map((event) => new Date(event.date));

	// Ajouter les deadlines des todos
	const datesWithDeadlines = todosWithDeadlines
		.map((todo) => {
			if (todo.deadline) {
				return new Date(todo.deadline);
			}
			return null;
		})
		.filter((date): date is Date => date !== null);

	const modifiers = {
		hasEvents: datesWithEvents,
		hasDeadlines: datesWithDeadlines,
	};

	const modifiersClassNames = {
		hasEvents:
			"relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
		hasDeadlines:
			"relative before:content-[''] before:absolute before:top-1 before:right-1 before:w-1 before:h-1 before:bg-orange-500 before:rounded-full",
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

		if (editingEvent) {
			updateEvent(editingEvent.id, {
				title: newEventTitle.trim(),
				date: newEventDate.toISOString().split("T")[0],
				time: newEventTime || undefined,
				description: newEventDescription || undefined,
			});
			toast.success("Événement modifié");
		} else {
			addEvent({
				title: newEventTitle.trim(),
				date: newEventDate.toISOString().split("T")[0],
				time: newEventTime || undefined,
				description: newEventDescription || undefined,
			});
			toast.success("Événement créé");
		}

		handleDialogOpenChange(false);
	};

	const handleEditEvent = (event: CalendarEvent) => {
		setEditingEvent(event);
		setNewEventTitle(event.title);
		setNewEventTime(event.time || "");
		setNewEventDescription(event.description || "");
		setNewEventDate(new Date(event.date));
		setIsDialogOpen(true);
	};

	const handleDialogOpenChange = (open: boolean) => {
		setIsDialogOpen(open);
		if (open) {
			// Quand on ouvre, s'assurer que newEventDate est défini
			if (!newEventDate && selectedDate) {
				setNewEventDate(selectedDate);
			}
		} else {
			// Quand on ferme, réinitialiser le formulaire
			setEditingEvent(null);
			setNewEventTitle("");
			setNewEventTime("");
			setNewEventDescription("");
			setNewEventDate(selectedDate);
		}
	};

	const handleExportJSON = () => {
		exportCalendarToJSON(events);
		toast.success("Calendrier exporté en JSON");
	};

	const handleExportICS = () => {
		exportCalendarToICS(events);
		toast.success("Calendrier exporté en .ics");
	};

	const handleImport = () => {
		fileInputRef.current?.click();
	};

	const handleFileImport = (file: File) => {
		importCalendarFromJSON(
			file,
			(importedEvents) => {
				// Ajouter les événements importés
				importedEvents.forEach((event) => {
					addEvent({
						title: event.title,
						date: event.date,
						time: event.time,
						description: event.description,
					});
				});
				toast.success(`${importedEvents.length} événement(s) importé(s)`);
			},
			(error) => {
				toast.error("Erreur d'import", { description: error });
			}
		);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFileImport(file);
		e.target.value = "";
	};

	const handleToggleNotifications = async () => {
		if (notificationPermission === "default") {
			const permission = await requestNotificationPermission();
			setNotificationPermission(permission);
			if (permission !== "granted") {
				toast.error("Permission de notification refusée");
				return;
			}
		}

		const newSettings = {
			...notificationSettings,
			enabled: !notificationSettings.enabled,
		};
		setNotificationSettings(newSettings);
		saveNotificationSettings(newSettings);
		toast.success(
			newSettings.enabled
				? "Notifications activées"
				: "Notifications désactivées"
		);
	};

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			const results = await calendarSyncManager.syncAll();
			const successCount = results.filter((r) => r.success).length;
			const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);

			if (successCount > 0) {
				toast.success(
					`Synchronisation réussie: ${totalSynced} événement(s) synchronisé(s)`
				);
			} else {
				toast.info("Aucun provider activé pour la synchronisation");
			}
		} catch (error) {
			toast.error("Erreur lors de la synchronisation", {
				description: error instanceof Error ? error.message : "Erreur inconnue",
			});
		} finally {
			setIsSyncing(false);
		}
	};

	const handleEventDragStart = (eventId: string) => {
		setDraggedEventId(eventId);
	};

	const handleEventDragEnd = () => {
		setDraggedEventId(null);
	};

	// Vérification périodique des notifications
	useEffect(() => {
		if (!notificationSettings.enabled) return;

		const interval = setInterval(
			() => {
				checkAndSendNotifications(
					events,
					notificationSettings,
					notificationNotifiedRef.current
				);
			},
			notificationSettings.checkInterval * 60 * 1000
		);

		// Vérifier immédiatement
		checkAndSendNotifications(
			events,
			notificationSettings,
			notificationNotifiedRef.current
		);

		return () => clearInterval(interval);
	}, [events, notificationSettings]);

	// Demander la permission au montage si pas encore demandée
	useEffect(() => {
		if (notificationPermission === "default" && "Notification" in window) {
			requestNotificationPermission().then((permission) => {
				setNotificationPermission(permission);
			});
		}
	}, [notificationPermission]);

	const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
	const selectedDateTodos = selectedDate
		? todosWithDeadlines.filter((todo) => {
				if (!todo.deadline) return false;
				const deadlineDate = new Date(todo.deadline);
				return (
					deadlineDate.getDate() === selectedDate.getDate() &&
					deadlineDate.getMonth() === selectedDate.getMonth() &&
					deadlineDate.getFullYear() === selectedDate.getFullYear()
				);
		  })
		: [];

	return (
		<Card className='w-full max-w-md'>
			<CardHeader>
				<div className='flex items-center justify-between w-full'>
					{/* Boutons d'action à gauche */}
					<ButtonGroup aria-label='Actions du calendrier'>
						{/* Vue selector */}
						<ButtonGroup>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='outline' size='sm'>
										{view === "month" && <Grid3x3 className='h-4 w-4' />}
										{view === "week" && <List className='h-4 w-4' />}
										{view === "day" && <CalendarViewIcon className='h-4 w-4' />}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem onClick={() => setView("month")}>
										<Grid3x3 className='mr-2 h-4 w-4' />
										Mois
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setView("week")}>
										<List className='mr-2 h-4 w-4' />
										Semaine
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setView("day")}>
										<CalendarViewIcon className='mr-2 h-4 w-4' />
										Jour
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</ButtonGroup>

						{/* Export/Import menu */}
						<ButtonGroup>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='outline' size='sm'>
										<Download className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem onClick={handleExportJSON}>
										<Download className='mr-2 h-4 w-4' />
										Exporter JSON
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleExportICS}>
										<Download className='mr-2 h-4 w-4' />
										Exporter .ics
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleImport}>
										<Upload className='mr-2 h-4 w-4' />
										Importer JSON
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</ButtonGroup>

						{/* Synchronisation et Notifications */}
						<ButtonGroup>
							<Button
								variant='outline'
								size='sm'
								onClick={handleSync}
								disabled={isSyncing}
								aria-label='Synchroniser le calendrier'
							>
								<RefreshCw
									className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
								/>
							</Button>
							{notificationPermission === "granted" && (
								<Button
									variant='outline'
									size='sm'
									onClick={handleToggleNotifications}
									aria-label={
										notificationSettings.enabled
											? "Désactiver les notifications"
											: "Activer les notifications"
									}
								>
									{notificationSettings.enabled ? (
										<Bell className='h-4 w-4' />
									) : (
										<BellOff className='h-4 w-4' />
									)}
								</Button>
							)}
						</ButtonGroup>
					</ButtonGroup>

					{/* Bouton Aujourd'hui à droite */}
					<Button
						size='sm'
						variant='outline'
						onClick={() => {
							const today = new Date();
							setCurrentDate(today);
							setSelectedDate(today);
							setNewEventDate(today);
						}}
					>
						Aujourd'hui
					</Button>
				</div>
			</CardHeader>

			{/* Calendrier shadcn/ui */}
			<CardContent className='px-4'>
				<motion.div
					key={`${view}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.2 }}
					className='flex justify-center'
				>
					{view === "month" && (
						<CalendarComponent
							mode='single'
							selected={selectedDate}
							onSelect={handleSelect}
							month={currentDate}
							onMonthChange={setCurrentDate}
							modifiers={modifiers}
							modifiersClassNames={modifiersClassNames}
							className='bg-transparent p-0'
							captionLayout='dropdown'
							required
							components={{
								DayButton: ({ day, modifiers, className, ...props }) => {
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
											const draggedEvent = events.find(
												(event) => event.id === draggedEventId
											);
											if (draggedEvent) {
												const newDate = day.date.toISOString().split("T")[0];
												updateEvent(draggedEventId, { date: newDate });
												toast.success("Événement déplacé");
												setSelectedDate(day.date);
											}
											setDraggedEventId(null);
										}
									};

									return (
										<div
											onDragOver={handleDragOver}
											onDrop={handleDrop}
											className='relative w-full h-full'
										>
											<Button
												variant='ghost'
												size='icon'
												className={cn(
													className,
													"data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground"
												)}
												data-day={day.date.toLocaleDateString()}
												data-selected-single={
													modifiers.selected &&
													!modifiers.range_start &&
													!modifiers.range_end &&
													!modifiers.range_middle
												}
												data-range-start={modifiers.range_start}
												data-range-end={modifiers.range_end}
												data-range-middle={modifiers.range_middle}
												{...props}
											>
												{day.date.getDate()}
											</Button>
										</div>
									);
								},
							}}
						/>
					)}
					{view === "week" && (
						<div className='w-full p-4 border rounded-md'>
							<p className='text-sm text-muted-foreground text-center'>
								Vue semaine (à implémenter)
							</p>
						</div>
					)}
					{view === "day" && (
						<div className='w-full p-4 border rounded-md'>
							<p className='text-sm text-muted-foreground text-center'>
								Vue jour (à implémenter)
							</p>
						</div>
					)}
				</motion.div>
			</CardContent>

			{/* Zone d'affichage des événements et todos du jour sélectionné */}
			{selectedDate && (
				<CardFooter className='flex flex-col items-start gap-3 border-t px-4 !pt-4'>
					<div className='flex w-full items-center justify-between px-1'>
						<div className='text-sm font-medium'>
							{selectedDate.toLocaleDateString("fr-FR", {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</div>
						<Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
							<DialogTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									className='size-6'
									title='Ajouter un événement'
								>
									<Plus className='h-4 w-4' />
									<span className='sr-only'>Ajouter un événement</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										{editingEvent ? "Modifier l'événement" : "Nouvel événement"}
									</DialogTitle>
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
											onClick={() => handleDialogOpenChange(false)}
										>
											Annuler
										</Button>
										<Button
											onClick={handleCreateEvent}
											disabled={!newEventDate || !newEventTitle.trim()}
										>
											{editingEvent ? "Enregistrer" : "Créer"}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>

					{/* Todos avec deadlines */}
					{selectedDateTodos.length > 0 && (
						<div className='mb-2'>
							<div className='space-y-1'>
								{selectedDateTodos.map((todo) => (
									<div
										key={todo.id}
										className='bg-muted text-xs p-2 rounded-md flex items-center gap-2'
									>
										<Clock className='h-3 w-3 text-orange-600 dark:text-orange-400' />
										<span className='flex-1'>{todo.title}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Événements */}
					<div className='flex w-full flex-col gap-2'>
						{selectedDateEvents.length === 0 &&
						selectedDateTodos.length === 0 ? (
							<p className='text-sm text-muted-foreground'>Aucun événement</p>
						) : (
							selectedDateEvents.map((event) => (
								<CalendarEventItem
									key={event.id}
									event={event}
									onEdit={() => handleEditEvent(event)}
									onDelete={() => deleteEvent(event.id)}
									onDragStart={() => handleEventDragStart(event.id)}
									onDragEnd={handleEventDragEnd}
									isDragging={draggedEventId === event.id}
								/>
							))
						)}
					</div>
				</CardFooter>
			)}

			{/* Input caché pour l'import */}
			<input
				ref={fileInputRef}
				type='file'
				accept='.json'
				onChange={handleFileInputChange}
				className='hidden'
			/>
		</Card>
	);
}

// Composant pour afficher un événement
function CalendarEventItem({
	event,
	onEdit,
	onDelete,
	onDragStart,
	onDragEnd,
	isDragging,
}: {
	event: CalendarEvent;
	onEdit: () => void;
	onDelete: () => void;
	onDragStart: () => void;
	onDragEnd: () => void;
	isDragging: boolean;
}) {
	const formatEventTime = (time?: string) => {
		if (!time) return "";
		const [hours, minutes] = time.split(":");
		return `${hours}:${minutes}`;
	};

	return (
		<motion.div
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			className={`bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full cursor-move group ${
				isDragging ? "opacity-50" : ""
			}`}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.15 }}
		>
			<div className='flex items-start justify-between gap-2'>
				<div className='flex-1'>
					<div className='font-medium'>{event.title}</div>
					{event.time && (
						<div className='text-muted-foreground text-xs'>
							{formatEventTime(event.time)}
						</div>
					)}
					{event.description && (
						<div className='text-muted-foreground text-xs mt-1'>
							{event.description}
						</div>
					)}
				</div>
				<div className='opacity-0 group-hover:opacity-100 transition-opacity'>
					<ButtonGroup aria-label="Actions de l'événement">
						<Button
							variant='ghost'
							size='icon'
							className='h-6 w-6'
							onClick={onEdit}
							aria-label="Modifier l'événement"
						>
							<Edit2 className='h-3 w-3' />
						</Button>
						<Button
							variant='ghost'
							size='icon'
							className='h-6 w-6'
							onClick={onDelete}
							aria-label="Supprimer l'événement"
						>
							×
						</Button>
					</ButtonGroup>
				</div>
			</div>
		</motion.div>
	);
}
