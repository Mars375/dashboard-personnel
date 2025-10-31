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
	Search,
	Repeat,
} from "lucide-react";
import {
	format,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isSameDay,
	addDays,
	subDays,
} from "date-fns";
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
import { isDateInRecurrence } from "@/lib/calendarRecurrence";

// Fonction utilitaire pour formater une date en YYYY-MM-DD en local (évite les problèmes de timezone)
function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

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
	const [newEventColor, setNewEventColor] = useState<string>("");
	const [newEventRecurrence, setNewEventRecurrence] = useState<
		"none" | "daily" | "weekly" | "monthly" | "yearly"
	>("none");
	const [newEventReminderMinutes, setNewEventReminderMinutes] = useState<
		number | undefined
	>(undefined);
	const [searchQuery, setSearchQuery] = useState("");

	// Palette de couleurs prédéfinie pour les événements
	const eventColors = [
		{ name: "Par défaut", value: "", class: "bg-primary" },
		{ name: "Bleu", value: "#3b82f6", class: "bg-blue-500" },
		{ name: "Vert", value: "#10b981", class: "bg-green-500" },
		{ name: "Rouge", value: "#ef4444", class: "bg-red-500" },
		{ name: "Orange", value: "#f59e0b", class: "bg-orange-500" },
		{ name: "Violet", value: "#8b5cf6", class: "bg-violet-500" },
		{ name: "Rose", value: "#ec4899", class: "bg-pink-500" },
		{ name: "Cyan", value: "#06b6d4", class: "bg-cyan-500" },
	];
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
	// Convertir "YYYY-MM-DD" en Date locale (évite les problèmes de timezone)
	// Inclure aussi les événements récurrents pour le mois actuel
	const datesWithEventsSet = new Set<string>();
	events.forEach((event) => {
		const [year, month, day] = event.date.split("-").map(Number);
		const eventDate = new Date(year, month - 1, day);
		datesWithEventsSet.add(formatDateLocal(eventDate));

		// Si récurrent, ajouter les occurrences du mois actuel
		if (event.recurrence && event.recurrence.type !== "none") {
			const monthStart = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth(),
				1
			);
			const monthEnd = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() + 1,
				0
			);

			for (
				let d = new Date(monthStart);
				d <= monthEnd;
				d.setDate(d.getDate() + 1)
			) {
				if (d >= eventDate) {
					if (isDateInRecurrence(d, event)) {
						datesWithEventsSet.add(formatDateLocal(d));
					}
				}
			}
		}
	});

	const datesWithEvents = Array.from(datesWithEventsSet).map((dateStr) => {
		const [year, month, day] = dateStr.split("-").map(Number);
		return new Date(year, month - 1, day);
	});

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
			toast.error("Veuillez remplir tous les champs obligatoires");
			return;
		}

		try {
			const eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> &
				Partial<Pick<CalendarEvent, "recurrence" | "reminderMinutes">> = {
				title: newEventTitle.trim(),
				date: formatDateLocal(newEventDate),
				time: newEventTime || undefined,
				description: newEventDescription || undefined,
				color: newEventColor || undefined,
				reminderMinutes: newEventReminderMinutes || undefined,
			};

			// Ajouter la répétition si sélectionnée
			if (newEventRecurrence !== "none") {
				eventData.recurrence = {
					type: newEventRecurrence,
					interval: 1,
				};
			}

			if (editingEvent) {
				updateEvent(editingEvent.id, eventData);
				toast.success("Événement modifié");
			} else {
				addEvent(eventData);
				toast.success("Événement créé");
			}

			handleDialogOpenChange(false);
		} catch (error) {
			toast.error("Erreur lors de la création/modification de l'événement");
			console.error("Erreur createEvent:", error);
		}
	};

	const handleEditEvent = (event: CalendarEvent) => {
		try {
			setEditingEvent(event);
			setNewEventTitle(event.title || "");
			setNewEventTime(event.time || "");
			setNewEventDescription(event.description || "");
			setNewEventColor(event.color || "");
			setNewEventRecurrence(event.recurrence?.type || "none");
			setNewEventReminderMinutes(event.reminderMinutes);
			// Gérer les dates invalides
			const eventDate = event.date ? new Date(event.date) : new Date();
			if (isNaN(eventDate.getTime())) {
				toast.error("Date invalide pour cet événement");
				setNewEventDate(selectedDate || new Date());
			} else {
				setNewEventDate(eventDate);
			}
			setIsDialogOpen(true);
		} catch (error) {
			toast.error("Erreur lors de l'édition de l'événement");
			console.error("Erreur editEvent:", error);
		}
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
			setNewEventColor("");
			setNewEventDate(selectedDate);
		}
	};

	const handleExportJSON = () => {
		try {
			if (events.length === 0) {
				toast.info("Aucun événement à exporter");
				return;
			}
			exportCalendarToJSON(events);
			toast.success("Calendrier exporté en JSON");
		} catch (error) {
			toast.error("Erreur lors de l'export JSON");
			console.error("Erreur exportJSON:", error);
		}
	};

	const handleExportICS = () => {
		try {
			if (events.length === 0) {
				toast.info("Aucun événement à exporter");
				return;
			}
			exportCalendarToICS(events);
			toast.success("Calendrier exporté en .ics");
		} catch (error) {
			toast.error("Erreur lors de l'export .ics");
			console.error("Erreur exportICS:", error);
		}
	};

	const handleImport = () => {
		fileInputRef.current?.click();
	};

	const handleFileImport = (file: File) => {
		try {
			// Vérifier le type de fichier
			if (!file.name.endsWith(".json")) {
				toast.error(
					"Format de fichier invalide. Veuillez utiliser un fichier JSON."
				);
				return;
			}

			importCalendarFromJSON(
				file,
				(importedEvents) => {
					if (!Array.isArray(importedEvents) || importedEvents.length === 0) {
						toast.info("Aucun événement à importer");
						return;
					}

					let importedCount = 0;
					importedEvents.forEach((event) => {
						try {
							// Valider les données de l'événement
							if (event.title && event.date) {
								addEvent({
									title: event.title,
									date: event.date,
									time: event.time,
									description: event.description,
									color: event.color,
								});
								importedCount++;
							}
						} catch (error) {
							console.error("Erreur lors de l'import d'un événement:", error);
						}
					});

					if (importedCount > 0) {
						toast.success(`${importedCount} événement(s) importé(s)`);
					} else {
						toast.warning("Aucun événement valide trouvé dans le fichier");
					}
				},
				(error) => {
					toast.error("Erreur d'import", { description: error });
				}
			);
		} catch (error) {
			toast.error("Erreur lors de la lecture du fichier");
			console.error("Erreur fileImport:", error);
		}
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

	// Filtrer les événements par recherche si nécessaire
	const filteredEvents = searchQuery.trim()
		? events.filter((event) => {
				const query = searchQuery.toLowerCase();
				return (
					event.title.toLowerCase().includes(query) ||
					event.description?.toLowerCase().includes(query) ||
					event.date.includes(query)
				);
		  })
		: events;

	// Fonction pour obtenir les événements d'une date avec recherche et répétition
	const getFilteredEventsForDate = (date: Date) => {
		const dateStr = formatDateLocal(date);
		return filteredEvents.filter((event) => {
			// Événement direct
			if (event.date === dateStr) return true;

			// Événement récurrent
			if (event.recurrence && event.recurrence.type !== "none") {
				return isDateInRecurrence(date, event);
			}

			return false;
		});
	};

	const selectedDateEvents = selectedDate
		? searchQuery.trim()
			? getFilteredEventsForDate(selectedDate)
			: getEventsForDate(selectedDate)
		: [];
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
				{/* Barre de recherche */}
				<div className='mb-4'>
					<div className='relative'>
						<Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							placeholder='Rechercher un événement...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='pl-8'
						/>
					</div>
				</div>

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
												const newDate = formatDateLocal(day.date);
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
						<div className='w-full'>
							<WeekView
								currentDate={currentDate}
								selectedDate={selectedDate}
								onSelect={handleSelect}
								getEventsForDate={getEventsForDate}
								onEventClick={(event: CalendarEvent) => handleEditEvent(event)}
								setCurrentDate={setCurrentDate}
								events={events}
								draggedEventId={draggedEventId}
								onEventDragStart={handleEventDragStart}
								onEventDragEnd={handleEventDragEnd}
								updateEvent={updateEvent}
							/>
						</div>
					)}
					{view === "day" && (
						<div className='w-full'>
							<DayView
								currentDate={currentDate}
								selectedDate={selectedDate}
								onSelect={handleSelect}
								getEventsForDate={getEventsForDate}
								onEventClick={(event: CalendarEvent) => handleEditEvent(event)}
								setCurrentDate={setCurrentDate}
								events={events}
								draggedEventId={draggedEventId}
								onEventDragStart={handleEventDragStart}
								onEventDragEnd={handleEventDragEnd}
								updateEvent={updateEvent}
							/>
						</div>
					)}
				</motion.div>
			</CardContent>

			{/* Zone d'affichage des événements */}
			{/* Si recherche active, afficher tous les résultats */}
			{searchQuery.trim() ? (
				<CardFooter className='flex flex-col items-start gap-3 border-t px-4 !pt-4 max-h-96 overflow-y-auto'>
					<div className='flex w-full items-center justify-between px-1'>
						<div className='text-sm font-medium'>
							Résultats de recherche ({filteredEvents.length})
						</div>
					</div>

					{/* Liste de tous les événements correspondant à la recherche */}
					{filteredEvents.length === 0 ? (
						<p className='text-sm text-muted-foreground'>
							Aucun événement trouvé pour "{searchQuery}"
						</p>
					) : (
						<div className='flex w-full flex-col gap-2'>
							{filteredEvents.map((event) => {
								const eventDate = new Date(event.date);
								return (
									<div key={event.id} className='space-y-1'>
										<div className='text-xs text-muted-foreground font-medium'>
											{eventDate.toLocaleDateString("fr-FR", {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}
											{event.time && ` - ${event.time}`}
										</div>
										<CalendarEventItem
											event={event}
											onEdit={() => {
												handleEditEvent(event);
												setSelectedDate(eventDate);
											}}
											onDelete={() => deleteEvent(event.id)}
											onDragStart={() => handleEventDragStart(event.id)}
											onDragEnd={handleEventDragEnd}
											isDragging={draggedEventId === event.id}
										/>
									</div>
								);
							})}
						</div>
					)}
				</CardFooter>
			) : (
				/* Sinon, afficher les événements du jour sélectionné */
				selectedDate && (
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
											{editingEvent
												? "Modifier l'événement"
												: "Nouvel événement"}
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

										{/* Couleur */}
										<div className='flex flex-col gap-2'>
											<Label>Couleur (optionnel)</Label>
											<div className='flex flex-wrap gap-2'>
												{eventColors.map((color) => (
													<button
														key={color.value}
														type='button'
														onClick={() => setNewEventColor(color.value)}
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
										<div className='flex flex-col gap-2'>
											<Label htmlFor='event-recurrence'>
												<Repeat className='mr-2 h-4 w-4 inline' />
												Répétition (optionnel)
											</Label>
											<select
												id='event-recurrence'
												value={newEventRecurrence}
												onChange={(e) =>
													setNewEventRecurrence(
														e.target.value as
															| "none"
															| "daily"
															| "weekly"
															| "monthly"
															| "yearly"
													)
												}
												className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
											>
												<option value='none'>Aucune</option>
												<option value='daily'>Quotidien</option>
												<option value='weekly'>Hebdomadaire</option>
												<option value='monthly'>Mensuel</option>
												<option value='yearly'>Annuel</option>
											</select>
										</div>

										{/* Rappel */}
										<div className='flex flex-col gap-2'>
											<Label htmlFor='event-reminder'>
												<Bell className='mr-2 h-4 w-4 inline' />
												Rappel (optionnel)
											</Label>
											<select
												id='event-reminder'
												value={newEventReminderMinutes || ""}
												onChange={(e) =>
													setNewEventReminderMinutes(
														e.target.value === ""
															? undefined
															: Number(e.target.value)
													)
												}
												className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
											>
												<option value=''>Aucun rappel</option>
												<option value='5'>5 minutes avant</option>
												<option value='15'>15 minutes avant</option>
												<option value='30'>30 minutes avant</option>
												<option value='60'>1 heure avant</option>
												<option value='120'>2 heures avant</option>
												<option value='1440'>1 jour avant</option>
											</select>
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
				)
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
	const eventColor = event.color || "";

	// Formater l'heure de l'événement
	const formatEventTime = () => {
		if (!event.time) return null;
		// Retourner l'heure telle quelle (format HH:mm)
		return event.time;
	};

	const formattedTime = formatEventTime();

	// Déterminer la couleur de la barre via after pseudo-element
	const afterBgColor = eventColor ? `${eventColor}70` : undefined;

	return (
		<div
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			className={cn(
				"bg-muted relative rounded-md p-2 pl-6 text-sm cursor-move group",
				"after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full",
				afterBgColor ? "" : "after:bg-primary/70",
				isDragging && "opacity-50"
			)}
			style={
				afterBgColor
					? ({
							"--after-bg": afterBgColor,
					  } as React.CSSProperties & { "--after-bg": string })
					: undefined
			}
		>
			{/* Barre colorée via after pseudo-element avec couleur custom */}
			{afterBgColor && (
				<style
					dangerouslySetInnerHTML={{
						__html: `.group[style*="--after-bg"]::after { background-color: var(--after-bg) !important; }`,
					}}
				/>
			)}
			<div className='flex items-start justify-between gap-2'>
				<div className='flex-1'>
					<div className='font-medium'>{event.title}</div>
					{formattedTime && (
						<div className='text-muted-foreground text-xs'>{formattedTime}</div>
					)}
				</div>
				<div className='opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1'>
					<Button
						variant='ghost'
						size='icon'
						className='h-6 w-6'
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						aria-label="Modifier l'événement"
					>
						<Edit2 className='h-3 w-3' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						className='h-6 w-6'
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						aria-label="Supprimer l'événement"
					>
						×
					</Button>
				</div>
			</div>
		</div>
	);
}

// Composant pour la vue semaine
function WeekView({
	currentDate,
	selectedDate,
	onSelect,
	getEventsForDate,
	onEventClick,
	setCurrentDate,
	events,
	draggedEventId,
	onEventDragStart,
	onEventDragEnd,
	updateEvent,
}: {
	currentDate: Date;
	selectedDate: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	getEventsForDate: (date: Date) => CalendarEvent[];
	onEventClick: (event: CalendarEvent) => void;
	setCurrentDate: (date: Date) => void;
	events: CalendarEvent[];
	draggedEventId: string | null;
	onEventDragStart: (eventId: string) => void;
	onEventDragEnd: () => void;
	updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
}) {
	try {
		// Valider que currentDate est valide
		if (isNaN(currentDate.getTime())) {
			return (
				<div className='p-4 text-center text-muted-foreground'>
					Date invalide
				</div>
			);
		}

		const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lundi
		const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
		const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

		const handlePreviousWeek = () => {
			setCurrentDate(subDays(currentDate, 7));
		};

		const handleNextWeek = () => {
			setCurrentDate(addDays(currentDate, 7));
		};

		const weekDaysNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

		return (
			<div className='space-y-2'>
				{/* Header avec navigation */}
				<div className='flex items-center justify-between mb-4'>
					<Button
						variant='outline'
						size='icon'
						onClick={handlePreviousWeek}
						aria-label='Semaine précédente'
					>
						<CalendarIcon className='h-4 w-4 rotate-180' />
					</Button>
					<div className='text-sm font-medium'>
						{format(weekStart, "d MMM", { locale: fr })} -{" "}
						{format(weekEnd, "d MMM yyyy", { locale: fr })}
					</div>
					<Button
						variant='outline'
						size='icon'
						onClick={handleNextWeek}
						aria-label='Semaine suivante'
					>
						<CalendarIcon className='h-4 w-4' />
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
								try {
									const draggedEvent = events.find(
										(event) => event.id === draggedEventId
									);
									if (draggedEvent) {
										const newDate = formatDateLocal(day);
										if (isNaN(new Date(newDate).getTime())) {
											toast.error("Date invalide");
											return;
										}
										updateEvent(draggedEventId, { date: newDate });
										toast.success("Événement déplacé");
										onSelect(day);
									}
								} catch (error) {
									toast.error("Erreur lors du déplacement de l'événement");
									console.error("Erreur dragDrop:", error);
								}
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
									onClick={() => onSelect(day)}
									className={cn(
										"text-sm font-medium mb-1 w-full text-left",
										isSameDay(day, new Date()) && "text-primary font-bold"
									)}
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
											onDragStart={() => onEventDragStart(event.id)}
											onDragEnd={onEventDragEnd}
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												onEventClick(event);
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
											{event.title}
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
		console.error("Erreur dans WeekView:", error);
		return (
			<div className='p-4 text-center text-muted-foreground'>
				Erreur lors de l'affichage de la vue semaine
			</div>
		);
	}
}

// Composant pour la vue jour
function DayView({
	currentDate,
	selectedDate,
	onSelect,
	getEventsForDate,
	onEventClick,
	setCurrentDate,
	events,
	draggedEventId,
	onEventDragStart,
	onEventDragEnd,
	updateEvent,
}: {
	currentDate: Date;
	selectedDate: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	getEventsForDate: (date: Date) => CalendarEvent[];
	onEventClick: (event: CalendarEvent) => void;
	setCurrentDate: (date: Date) => void;
	events: CalendarEvent[];
	draggedEventId: string | null;
	onEventDragStart: (eventId: string) => void;
	onEventDragEnd: () => void;
	updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
}) {
	try {
		const displayDate = selectedDate || currentDate;
		// Valider que la date est valide
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
			setCurrentDate(subDays(displayDate, 1));
			onSelect(subDays(displayDate, 1));
		};

		const handleNextDay = () => {
			setCurrentDate(addDays(displayDate, 1));
			onSelect(addDays(displayDate, 1));
		};

		const hours = Array.from({ length: 24 }, (_, i) => i);

		return (
			<div className='space-y-4'>
				{/* Header avec navigation */}
				<div className='flex items-center justify-between'>
					<Button
						variant='outline'
						size='icon'
						onClick={handlePreviousDay}
						aria-label='Jour précédent'
					>
						<CalendarIcon className='h-4 w-4 rotate-180' />
					</Button>
					<div className='text-lg font-medium'>
						{format(displayDate, "EEEE d MMMM yyyy", { locale: fr })}
					</div>
					<Button
						variant='outline'
						size='icon'
						onClick={handleNextDay}
						aria-label='Jour suivant'
					>
						<CalendarIcon className='h-4 w-4' />
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
							onDrop={(e: React.DragEvent) => {
								if (draggedEventId) {
									e.preventDefault();
									e.stopPropagation();
									try {
										const draggedEvent = events.find(
											(event) => event.id === draggedEventId
										);
										if (draggedEvent) {
											// Calculer la nouvelle heure basée sur la position du drop
											const containerRect = (
												e.currentTarget as HTMLElement
											).getBoundingClientRect();
											const dropY = e.clientY - containerRect.top;
											// Chaque heure = 64px (h-16), donc calculer les minutes
											const totalMinutes = Math.max(
												0,
												Math.min(1439, Math.round((dropY / 64) * 60))
											);
											const newHours = Math.floor(totalMinutes / 60);
											const newMins = totalMinutes % 60;
											const newTime = `${String(newHours).padStart(
												2,
												"0"
											)}:${String(newMins).padStart(2, "0")}`;

											updateEvent(draggedEventId, { time: newTime });
											toast.success(`Heure changée à ${newTime}`);
										}
									} catch (error) {
										toast.error("Erreur lors du changement d'heure");
										console.error("Erreur dragDrop time:", error);
									}
								}
							}}
						>
							{hours.map((hour) => (
								<div key={hour} className='border-b h-16 p-1 relative' />
							))}
							{dayEvents.map((event) => {
								if (!event.time) return null;
								const [hours, minutes] = event.time.split(":").map(Number);
								const top = (hours * 60 + minutes) * (64 / 60); // 64px = h-16

								return (
									<motion.div
										key={event.id}
										draggable
										onDragStart={() => {
											onEventDragStart(event.id);
										}}
										onDragEnd={onEventDragEnd}
										onClick={() => onEventClick(event)}
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
										{event.time && (
											<div className='text-xs text-muted-foreground'>
												{event.time}
											</div>
										)}
									</motion.div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Liste des événements sans heure */}
				{dayEvents.filter((e) => !e.time).length > 0 && (
					<div className='space-y-2'>
						<div className='text-sm font-medium text-muted-foreground'>
							Événements sans heure
						</div>
						{dayEvents
							.filter((e) => !e.time)
							.map((event) => (
								<CalendarEventItem
									key={event.id}
									event={event}
									onEdit={() => onEventClick(event)}
									onDelete={() => {}}
									onDragStart={() => {}}
									onDragEnd={() => {}}
									isDragging={false}
								/>
							))}
					</div>
				)}
			</div>
		);
	} catch (error) {
		console.error("Erreur dans DayView:", error);
		return (
			<div className='p-4 text-center text-muted-foreground'>
				Erreur lors de l'affichage de la vue jour
			</div>
		);
	}
}
