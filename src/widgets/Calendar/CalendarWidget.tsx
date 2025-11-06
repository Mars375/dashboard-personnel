// src/widgets/Calendar/CalendarWidget.tsx
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarFull } from "@/components/ui/calendar-full";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonGroup } from "@/components/ui/button-group";
import { useCalendar } from "@/hooks/useCalendar";
import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
	Plus,
	Download,
	Upload,
	Bell,
	BellOff,
	Calendar as CalendarViewIcon,
	Grid3x3,
	List,
	RefreshCw,
	Search,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
import type { WidgetProps } from "@/lib/widgetSize";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { logger } from "@/lib/logger";
import { formatDateLocal } from "@/lib/utils";
import { EventForm, EventItem } from "./components";

function CalendarWidgetComponent({ size = "medium" }: WidgetProps) {
	const isCompact = useMemo(() => size === "compact", [size]);
	const isMedium = useMemo(() => size === "medium", [size]);
	const isFull = size === "full";
	const {
		currentDate,
		setCurrentDate,
		getEventsForDate,
		events,
		addEvent,
		addEvents,
		updateEvent,
		deleteEvent,
		view,
		setView,
	} = useCalendar();

	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		currentDate
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
	const [newEventDate, setNewEventDate] = useState<Date | undefined>(
		selectedDate
	);
	const [newEventEndDate, setNewEventEndDate] = useState<Date | undefined>(
		undefined
	);
	const [newEventTitle, setNewEventTitle] = useState("");
	const [newEventTime, setNewEventTime] = useState("");
	const [newEventEndTime, setNewEventEndTime] = useState("");
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
	// Drag & drop uniquement pour CalendarEventItem dans les listes
	const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

	// Plus d'affichage des todos dans le calendrier (séparation complète avec TodoWidget)
	const todosWithDeadlines: Array<{
		id: string;
		title: string;
		deadline: string;
		listName?: string;
	}> = [];

	// Obtenir les dates qui ont des événements pour les marquer visuellement
	// Convertir "YYYY-MM-DD" en Date locale (évite les problèmes de timezone)
	// Inclure aussi les événements récurrents et multi-jours pour le mois actuel
	const datesWithEventsSet = new Set<string>();
	events.forEach((event) => {
		const [year, month, day] = event.date.split("-").map(Number);
		const eventDate = new Date(year, month - 1, day);
		eventDate.setHours(0, 0, 0, 0);

		// Si événement multi-jours, ajouter toutes les dates de la plage
		if (event.endDate) {
			const [endYear, endMonth, endDay] = event.endDate.split("-").map(Number);
			const endDate = new Date(endYear, endMonth - 1, endDay);
			endDate.setHours(23, 59, 59, 999);

			for (
				let d = new Date(eventDate);
				d <= endDate;
				d.setDate(d.getDate() + 1)
			) {
				datesWithEventsSet.add(formatDateLocal(d));
			}
		} else {
			// Événement d'un seul jour
			datesWithEventsSet.add(formatDateLocal(eventDate));
		}

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

	// Modifiers gérés par calendar-full maintenant

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
				endDate: newEventEndDate ? formatDateLocal(newEventEndDate) : undefined,
				time: newEventTime || undefined,
				endTime: newEventEndTime || undefined,
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
				// Pousser vers Google Calendar en arrière-plan
				const currentEvent = events.find((e) => e.id === editingEvent.id);
				if (currentEvent) {
					pushEventToGoogle({ ...currentEvent, ...eventData }, "update").catch(
						(err) => {
							logger.error("Erreur push Google:", err);
						}
					);
				}
			} else {
				const newEvent = addEvent(eventData);
				toast.success("Événement créé");
				// Pousser vers Google Calendar en arrière-plan
				pushEventToGoogle(newEvent, "create").catch((err) => {
					logger.error("Erreur push Google:", err);
				});
			}

			handleDialogOpenChange(false);
		} catch (error) {
			toast.error("Erreur lors de la création/modification de l'événement");
			logger.error("Erreur createEvent:", error);
		}
	};

	const handleEditEvent = (event: CalendarEvent) => {
		try {
			setEditingEvent(event);
			setNewEventTitle(event.title || "");
			setNewEventTime(event.time || "");
			setNewEventEndTime(event.endTime || "");
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
			// Gérer la date de fin
			if (event.endDate) {
				const endDate = new Date(event.endDate);
				if (!isNaN(endDate.getTime())) {
					setNewEventEndDate(endDate);
				} else {
					setNewEventEndDate(undefined);
				}
			} else {
				setNewEventEndDate(undefined);
			}
			setIsDialogOpen(true);
		} catch (error) {
			toast.error("Erreur lors de l'édition de l'événement");
			logger.error("Erreur editEvent:", error);
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
			setNewEventEndTime("");
			setNewEventDescription("");
			setNewEventColor("");
			setNewEventDate(selectedDate);
			setNewEventEndDate(undefined);
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
			logger.error("Erreur exportJSON:", error);
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
			logger.error("Erreur exportICS:", error);
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
							logger.error("Erreur lors de l'import d'un événement:", error);
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
			logger.error("Erreur fileImport:", error);
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

	// Fonction pour pousser un événement vers Google Calendar
	const pushEventToGoogle = async (
		event: CalendarEvent,
		operation: "create" | "update" | "delete"
	) => {
		try {
			const oauthManager = getOAuthManager();
			const isGoogleConnected = oauthManager.isConnected("google");

			if (!isGoogleConnected) {
				logger.debug("⏭️ Google Calendar non connecté, skip push");
				return;
			}

			// Activer le provider si nécessaire
			const googleProvider = calendarSyncManager
				.getAllProviders()
				.find((p) => p.name === "Google Calendar");

			if (!googleProvider || !googleProvider.enabled) {
				const config = {
					providers: {
						googleCalendar: {
							enabled: true,
							calendarId: "primary",
						},
					},
				};
				calendarSyncManager.updateConfig(config);
			}

			if (!googleProvider) {
				logger.debug("⏭️ Google Calendar provider non disponible");
				return;
			}

			// Pour les événements qui viennent déjà de Google (avec ID google-*),
			// on les met à jour/supprime directement
			if (event.id.startsWith("google-")) {
				if (operation === "delete") {
					// Supprimer un événement Google directement via l'API
					const googleEventId = event.id.replace("google-", "");
					const oauthManager = getOAuthManager();
					const accessToken = await oauthManager.getValidAccessToken("google");
					// Utiliser getCalendarId() si disponible, sinon "primary"
					// googleProvider est de type GoogleCalendarSyncProvider qui a getCalendarId()
					const googleSyncProvider = googleProvider as unknown as {
						getCalendarId?: () => Promise<string>;
					};
					const calendarId = googleSyncProvider.getCalendarId
						? await googleSyncProvider.getCalendarId()
						: "primary";

					const response = await fetch(
						`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
							calendarId
						)}/events/${googleEventId}`,
						{
							method: "DELETE",
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						}
					);

					if (!response.ok && response.status !== 404) {
						// 404 = déjà supprimé, c'est OK
						const error = await response
							.json()
							.catch(() => ({ error: { message: response.statusText } }));
						throw new Error(
							`Erreur lors de la suppression: ${
								error.error?.message || response.statusText
							}`
						);
					}
					logger.debug(`✅ Événement Google supprimé: ${googleEventId}`);
				} else {
					// Mise à jour d'un événement Google existant
					await googleProvider.pushEvents([event]);
					logger.debug(
						`✅ Événement Google ${
							operation === "create" ? "créé" : "mis à jour"
						}`
					);
				}
			} else {
				// Événement local : créer dans Google
				if (operation === "create") {
					const createdEvents = await googleProvider.pushEvents([event]);
					// Si création, mettre à jour l'ID local avec l'ID Google
					if (createdEvents && createdEvents.length > 0) {
						const googleEvent = createdEvents[0];
						if (googleEvent?.id && googleEvent.id.startsWith("google-")) {
							// Mettre à jour l'ID de l'événement local
							updateEvent(event.id, { id: googleEvent.id });
							logger.debug(
								`✅ Événement local synchronisé vers Google avec ID: ${googleEvent.id}`
							);
						}
					}
				} else if (operation === "update") {
					// Pour les événements locaux mis à jour, créer dans Google (car ils n'existent pas encore là-bas)
					await googleProvider.pushEvents([event]);
					logger.debug(`✅ Événement local mis à jour dans Google`);
				} else if (operation === "delete") {
					// Pour les événements locaux supprimés, pas besoin de les supprimer de Google
					// car ils n'existent que localement
					logger.debug(
						"⏭️ Événement local supprimé (non synchronisé avec Google)"
					);
				}
			}
		} catch (error) {
			logger.error("❌ Erreur lors du push vers Google Calendar:", error);
			// Ne pas afficher de toast d'erreur pour ne pas perturber l'UX
			// L'utilisateur peut toujours faire une sync manuelle
		}
	};

	// Utiliser un ref pour éviter les appels multiples simultanés
	const isSyncingRef = useRef(false);

	const handleSync = useCallback(async () => {
		if (isSyncingRef.current) {
			return; // Éviter les appels multiples simultanés
		}
		isSyncingRef.current = true;
		setIsSyncing(true);
		try {
			// Vérifier si Google Calendar est connecté
			const oauthManager = getOAuthManager();
			const isGoogleConnected = oauthManager.isConnected("google");

			// Si connecté, activer le provider
			if (isGoogleConnected) {
				const config = {
					providers: {
						googleCalendar: {
							enabled: true,
							calendarId: "primary",
						},
					},
				};
				calendarSyncManager.updateConfig(config);
			}

			const results = await calendarSyncManager.syncAll();
			const successCount = results.filter((r) => r.success).length;
			const totalSynced = results.reduce((sum, r) => sum + (r.synced ?? 0), 0);

			if (successCount > 0) {
				// Recharger les événements depuis Google Calendar
				const googleProvider = calendarSyncManager
					.getAllProviders()
					.find((p) => p.name === "Google Calendar");
				let pulledEventsCount = 0;
				let newEventsCount = 0;

				if (googleProvider && googleProvider.enabled) {
					const pulledEvents = await googleProvider.pullEvents();
					pulledEventsCount = pulledEvents.length;

					// Utiliser les événements actuels directement (pas depuis les dépendances)
					const currentEvents = events;
					const existingEventIds = new Set(currentEvents.map((e) => e.id));
					const newEvents = pulledEvents.filter((event) => {
						// Si l'événement a un ID Google, vérifier s'il existe déjà
						if (event.id && existingEventIds.has(event.id)) {
							return false;
						}
						// Sinon, vérifier s'il existe un événement avec la même date et le même titre
						const exists = currentEvents.some(
							(e) => e.date === event.date && e.title === event.title
						);
						return !exists;
					});

					// Ajouter les nouveaux événements en une seule fois
					if (newEvents.length > 0) {
						// Utiliser addEvents pour ajouter tous les événements en une seule opération
						// Cela garantit que la sauvegarde se fait avec tous les événements
						addEvents(newEvents);
						newEventsCount = newEvents.length;
					}
				}

				// Une seule notification combinée
				if (newEventsCount > 0) {
					toast.success(
						`Synchronisation réussie: ${newEventsCount} nouvel(le)(s) événement(s) ajouté(s) depuis Google Calendar`
					);
				} else if (pulledEventsCount > 0) {
					toast.success(
						`Synchronisation réussie: ${pulledEventsCount} événement(s) récupéré(s) (déjà présents)`
					);
				} else {
					toast.success(
						`Synchronisation réussie: ${totalSynced} événement(s) synchronisé(s)`
					);
				}
			} else {
				if (!isGoogleConnected) {
					toast.info("Connectez-vous à Google Calendar pour synchroniser");
				} else {
					toast.info("Aucun provider activé pour la synchronisation");
				}
			}
		} catch (error) {
			toast.error("Erreur lors de la synchronisation", {
				description: error instanceof Error ? error.message : "Erreur inconnue",
			});
			logger.error("Erreur lors de la synchronisation:", error);
		} finally {
			isSyncingRef.current = false;
			setIsSyncing(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Pas de dépendances - utiliser refs pour éviter la boucle

	// Initialiser la synchronisation Google Calendar si Google est connecté
	const providerInitializedRef = useRef(false);
	const hasSyncedInitiallyRef = useRef(false);
	const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const oauthManager = getOAuthManager();

		const checkConnection = () => {
			const connected = oauthManager.isConnected("google");

			if (connected && !providerInitializedRef.current) {
				// Activer le provider si connecté (une seule fois)
				const config = {
					providers: {
						googleCalendar: {
							enabled: true,
							calendarId: "primary",
						},
					},
				};
				calendarSyncManager.updateConfig(config);
				providerInitializedRef.current = true;
				logger.debug("✅ Google Calendar provider initialisé");

				// Synchroniser une seule fois après initialisation
				if (!hasSyncedInitiallyRef.current) {
					hasSyncedInitiallyRef.current = true;
					setTimeout(async () => {
						if (!isSyncingRef.current) {
							try {
								logger.debug("🔄 Synchronisation initiale Google Calendar...");
								await handleSync();
							} catch (error) {
								logger.error(
									"Erreur lors de la synchronisation initiale:",
									error
								);
							}
						}
					}, 2000);

					// Puis synchroniser toutes les 5 minutes
					if (syncIntervalRef.current) {
						clearInterval(syncIntervalRef.current);
					}
					syncIntervalRef.current = setInterval(
						async () => {
							if (oauthManager.isConnected("google") && !isSyncingRef.current) {
								logger.debug(
									"🔄 Synchronisation automatique Google Calendar..."
								);
								try {
									await handleSync();
								} catch (error) {
									logger.error(
										"Erreur lors de la synchronisation périodique:",
										error
									);
								}
							}
						},
						5 * 60 * 1000
					); // 5 minutes
				}
			} else if (!connected && providerInitializedRef.current) {
				providerInitializedRef.current = false;
				hasSyncedInitiallyRef.current = false;
				if (syncIntervalRef.current) {
					clearInterval(syncIntervalRef.current);
					syncIntervalRef.current = null;
				}
			}
		};

		// Vérifier immédiatement
		checkConnection();

		// Vérifier périodiquement la connexion (toutes les 2 secondes)
		const connectionInterval = setInterval(checkConnection, 2000);

		return () => {
			clearInterval(connectionInterval);
			if (syncIntervalRef.current) {
				clearInterval(syncIntervalRef.current);
				syncIntervalRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Pas de dépendances pour éviter la boucle

	// Drag & drop pour CalendarEventItem (liste d'événements)
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
	const filteredEvents = useMemo(() => {
		if (!searchQuery.trim()) return events;
		const query = searchQuery.toLowerCase();
		return events.filter((event) => {
			return (
				event.title.toLowerCase().includes(query) ||
				event.description?.toLowerCase().includes(query) ||
				event.date.includes(query)
			);
		});
	}, [events, searchQuery]);

	// Fonction pour obtenir les événements d'une date avec recherche et répétition
	const getFilteredEventsForDate = useCallback(
		(date: Date) => {
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
		},
		[filteredEvents]
	);

	const selectedDateEvents = useMemo(() => {
		if (!selectedDate) return [];
		return searchQuery.trim()
			? getFilteredEventsForDate(selectedDate)
			: getEventsForDate(selectedDate);
	}, [selectedDate, searchQuery, getFilteredEventsForDate, getEventsForDate]);

	const padding = isCompact ? "p-2" : isMedium ? "px-3 pb-3 pt-1" : "p-4";

	// Refs pour virtualisation
	const todayEventsScrollRef = useRef<HTMLDivElement>(null);
	const selectedEventsScrollRef = useRef<HTMLDivElement>(null);

	// Événements d'aujourd'hui pour version compacte
	const today = useMemo(() => {
		const t = new Date();
		t.setHours(0, 0, 0, 0);
		return t;
	}, []);

	const todayEvents = useMemo(() => {
		return events
			.filter((e) => {
				const eventDate = new Date(e.date);
				eventDate.setHours(0, 0, 0, 0);
				return eventDate.getTime() === today.getTime();
			})
			.sort((a, b) => {
				if (!a.time && !b.time) return 0;
				if (!a.time) return 1;
				if (!b.time) return -1;
				return a.time.localeCompare(b.time);
			});
	}, [events, today]);

	const sortedSelectedDateEvents = useMemo(() => {
		return [...selectedDateEvents].sort((a, b) => {
			if (!a.time && !b.time) return 0;
			if (!a.time) return 1;
			if (!b.time) return -1;
			return a.time.localeCompare(b.time);
		});
	}, [selectedDateEvents]);

	// Virtualisation pour todayEvents si plus de 50
	const shouldVirtualizeToday = todayEvents.length > 50;
	const todayVirtualizer = useVirtualizer({
		count: todayEvents.length,
		getScrollElement: () => todayEventsScrollRef.current,
		estimateSize: () => 60,
		overscan: 3,
	});

	// Virtualisation pour selectedDateEvents si plus de 50
	const shouldVirtualizeSelected = sortedSelectedDateEvents.length > 50;
	const selectedEventsVirtualizer = useVirtualizer({
		count: sortedSelectedDateEvents.length,
		getScrollElement: () => selectedEventsScrollRef.current,
		estimateSize: () => 80,
		overscan: 3,
	});

	// Forcer la vue "month" en mode compact et medium
	useEffect(() => {
		if ((isCompact || isMedium) && view !== "month") {
			setView("month");
		}
	}, [isCompact, isMedium, view, setView]);

	return (
		<Card
			className={`w-full h-full max-w-none ${padding} flex flex-col ${
				isCompact ? "overflow-hidden" : "overflow-auto"
			} min-h-0`}
		>
			{/* COMPACT VERSION - Aujourd'hui et ses événements uniquement */}
			{isCompact ? (
				<div className='flex flex-col h-full justify-center gap-2'>
					{/* Date d'aujourd'hui */}
					<div className='text-center'>
						<div className='text-sm font-bold'>
							{today.toLocaleDateString("fr-FR", {
								weekday: "long",
								day: "numeric",
								month: "long",
							})}
						</div>
						<div className='text-xs text-muted-foreground mt-0.5'>
							{today.toLocaleDateString("fr-FR", { year: "numeric" })}
						</div>
					</div>

					{/* Événements d'aujourd'hui */}
					<div
						ref={todayEventsScrollRef}
						className='flex-1 min-h-0 overflow-y-auto'
					>
						{todayEvents.length === 0 ? (
							<div className='text-xs text-muted-foreground text-center py-4'>
								Aucun événement aujourd'hui
							</div>
						) : shouldVirtualizeToday && todayEventsScrollRef.current ? (
							<div
								style={{
									height: `${todayVirtualizer.getTotalSize()}px`,
									width: "100%",
									position: "relative",
								}}
							>
								{todayVirtualizer
									.getVirtualItems()
									.map(
										(virtualItem: {
											index: number;
											size: number;
											start: number;
										}) => {
											const event = todayEvents[virtualItem.index];
											return (
												<div
													key={event.id}
													style={{
														position: "absolute",
														top: 0,
														left: 0,
														width: "100%",
														height: `${virtualItem.size}px`,
														transform: `translateY(${virtualItem.start}px)`,
													}}
													className='flex items-start gap-2 p-2 border rounded-md hover:bg-accent transition-colors mb-1.5'
												>
													{event.time && (
														<div className='text-xs font-medium text-muted-foreground shrink-0 min-w-[45px]'>
															{event.time}
														</div>
													)}
													<div className='flex-1 min-w-0'>
														<div className='text-xs font-medium'>
															{event.title}
														</div>
														{event.description && (
															<div className='text-[10px] text-muted-foreground mt-0.5 line-clamp-1'>
																{event.description}
															</div>
														)}
													</div>
												</div>
											);
										}
									)}
							</div>
						) : (
							<div className='flex flex-col gap-1.5'>
								{todayEvents.map((event) => (
									<div
										key={event.id}
										className='flex items-start gap-2 p-2 border rounded-md hover:bg-accent transition-colors'
									>
										{event.time && (
											<div className='text-xs font-medium text-muted-foreground shrink-0 min-w-[45px]'>
												{event.time}
											</div>
										)}
										<div className='flex-1 min-w-0'>
											<div className='text-xs font-medium'>{event.title}</div>
											{event.description && (
												<div className='text-[10px] text-muted-foreground mt-0.5 line-clamp-1'>
													{event.description}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			) : null}

			{isMedium && (
				// MEDIUM VERSION - Vue des 7 prochains jours
				<div className='flex flex-col h-full gap-2'>
					{/* Header : Date + Bouton ajouter */}
					<div className='shrink-0 flex items-center justify-between pb-2 border-b'>
						<div className='text-sm font-semibold'>
							{selectedDate
								? selectedDate.toLocaleDateString("fr-FR", {
										weekday: "long",
										day: "numeric",
										month: "long",
								  })
								: currentDate.toLocaleDateString("fr-FR", {
										weekday: "long",
										day: "numeric",
										month: "long",
								  })}
						</div>
						<Button
							size='sm'
							variant='outline'
							className='h-7 text-xs'
							onClick={() => {
								setNewEventDate(selectedDate || currentDate);
								setIsDialogOpen(true);
							}}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Plus className='h-3 w-3 mr-1.5' />
							Ajouter
						</Button>
					</div>

					{/* Grille des 7 prochains jours */}
					<div className='shrink-0'>
						<div className='grid grid-cols-7 gap-1.5'>
							{Array.from({ length: 7 }).map((_, index) => {
								const dayDate = new Date(today);
								dayDate.setDate(dayDate.getDate() + index);
								const dayEvents = getEventsForDate(dayDate);
								const dayDateStr = formatDateLocal(dayDate);
								const isSelected =
									selectedDate && formatDateLocal(selectedDate) === dayDateStr;
								const isToday = dayDate.toDateString() === today.toDateString();

								return (
									<div
										key={dayDateStr}
										className={`flex flex-col border rounded-md p-1.5 cursor-pointer transition-colors ${
											isSelected
												? "bg-primary/10 border-primary"
												: "hover:bg-muted/50"
										}`}
										onClick={() => handleSelect(dayDate)}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
									>
										{/* Jour de la semaine */}
										<div
											className={`text-[10px] font-medium text-center mb-0.5 ${
												isToday ? "text-primary" : "text-muted-foreground"
											}`}
										>
											{dayDate.toLocaleDateString("fr-FR", {
												weekday: "short",
											})}
										</div>

										{/* Numéro du jour */}
										<div
											className={`text-xs font-semibold text-center mb-1 ${
												isToday ? "text-primary" : ""
											}`}
										>
											{dayDate.getDate()}
										</div>

										{/* Événements */}
										<div className='space-y-0.5'>
											{dayEvents.length === 0 ? (
												<div className='text-[9px] text-muted-foreground text-center py-1'>
													—
												</div>
											) : (
												dayEvents
													.sort((a, b) => {
														if (!a.time && !b.time) return 0;
														if (!a.time) return 1;
														if (!b.time) return -1;
														return a.time.localeCompare(b.time);
													})
													.slice(0, 2)
													.map((event) => (
														<div
															key={event.id}
															className='bg-muted rounded text-[9px] px-1 py-0.5 truncate'
														>
															{event.title}
														</div>
													))
											)}
											{dayEvents.length > 2 && (
												<div className='text-[8px] text-muted-foreground text-center pt-0.5'>
													+{dayEvents.length - 2}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Liste des événements du jour sélectionné */}
					{selectedDate && (
						<div className='flex-1 min-h-0 overflow-y-auto border-t pt-2 mt-2'>
							<div className='space-y-2'>
								{sortedSelectedDateEvents.length === 0 ? (
									<div className='text-center py-6 text-xs text-muted-foreground'>
										Aucun événement
									</div>
								) : (
									sortedSelectedDateEvents.map((event) => {
										const eventColor = event.color || "#3b82f6";
										const hasEndTime =
											event.endTime && event.endTime !== event.time;

										return (
											<div
												key={event.id}
												className='flex items-start gap-3 cursor-pointer group hover:bg-muted/50 rounded-md p-2 transition-colors'
												onClick={() => handleEditEvent(event)}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												{/* Ligne verticale colorée */}
												<div
													className='w-1 rounded-full shrink-0 mt-1'
													style={{ backgroundColor: eventColor }}
												/>

												{/* Contenu de l'événement */}
												<div className='flex-1 min-w-0'>
													<div className='flex items-start justify-between gap-2'>
														<div className='flex-1 min-w-0'>
															<div className='text-sm font-semibold mb-0.5'>
																{event.title}
															</div>
															{event.time && (
																<div className='text-xs text-muted-foreground'>
																	{event.time}
																	{hasEndTime && ` - ${event.endTime}`}
																</div>
															)}
															{event.description && (
																<div className='text-xs text-muted-foreground mt-1 line-clamp-2'>
																	{event.description}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{isFull && (
				<>
					{/* CardHeader seulement en mode full */}
					<CardHeader>
						{/* Barre de recherche - seulement en mode full */}
						{isFull && (
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
						)}

						{/* FULL VERSION - Actions complètes */}
						<div className='flex items-center justify-between w-full'>
							{/* Boutons d'action à gauche */}
							<ButtonGroup aria-label='Actions du calendrier'>
								{/* Vue selector - seulement en mode full */}
								{isFull && (
									<ButtonGroup>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='outline'
													size='sm'
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
													{view === "month" && <Grid3x3 className='h-4 w-4' />}
													{view === "week" && <List className='h-4 w-4' />}
													{view === "day" && (
														<CalendarViewIcon className='h-4 w-4' />
													)}
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuItem
													onClick={() => setView("month")}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
													<Grid3x3 className='mr-2 h-4 w-4' />
													Mois
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setView("week")}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
													<List className='mr-2 h-4 w-4' />
													Semaine
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setView("day")}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
													<CalendarViewIcon className='mr-2 h-4 w-4' />
													Jour
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</ButtonGroup>
								)}

								{/* Export/Import menu */}
								<ButtonGroup>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant='outline'
												size='sm'
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												<Download className='h-4 w-4' />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end'>
											<DropdownMenuItem
												onClick={handleExportJSON}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												<Download className='mr-2 h-4 w-4' />
												Exporter JSON
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={handleExportICS}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												<Download className='mr-2 h-4 w-4' />
												Exporter .ics
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={handleImport}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
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
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
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
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
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
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								Aujourd'hui
							</Button>
						</div>
					</CardHeader>
				</>
			)}

			{/* FULL VERSION - Calendrier shadcn/ui */}
			{isFull && (
				<CardContent className='px-4'>
					<motion.div
						key={`${view}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2 }}
						className='flex justify-center w-full'
					>
						{/* Full : Utilisation du nouveau Calendar complet */}
						<CalendarFull
							currentDate={currentDate}
							onDateChange={setCurrentDate}
							selectedDate={selectedDate}
							onSelectDate={handleSelect}
							view={view}
							onViewChange={setView}
							events={events}
							getEventsForDate={getEventsForDate}
							onEventClick={(event: CalendarEvent) => handleEditEvent(event)}
							onEventUpdate={updateEvent}
							onSync={handleSync}
							syncLoading={isSyncing}
							className='w-full'
							captionLayout='dropdown-buttons'
							showOutsideDays={true}
							todosWithDeadlines={todosWithDeadlines.map((todo) => ({
								id: todo.id,
								title: todo.title,
								deadline: todo.deadline!,
							}))}
						/>
					</motion.div>
				</CardContent>
			)}

			{/* Zone d'affichage des événements - Full uniquement */}
			{isFull && (
				<>
					{/* Si recherche active, afficher tous les résultats */}
					{searchQuery.trim() ? (
						<CardFooter className='flex flex-col items-start border-t gap-3 px-4 pt-4 max-h-96 overflow-y-auto'>
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
												<EventItem
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
							<CardFooter className='flex flex-col items-start gap-3 border-t px-4 pt-4'>
								<div className='flex w-full items-center justify-between px-1'>
									<div className='text-sm font-medium'>
										{selectedDate.toLocaleDateString("fr-FR", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</div>
									<Dialog
										open={isDialogOpen}
										onOpenChange={handleDialogOpenChange}
									>
										<DialogTrigger asChild>
											<Button
												variant='ghost'
												size='icon'
												className='size-6'
												title='Ajouter un événement'
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
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
												<DialogDescription>
													{editingEvent
														? "Modifiez les détails de votre événement."
														: "Créez un nouvel événement dans votre calendrier."}
												</DialogDescription>
											</DialogHeader>
											<EventForm
												editingEvent={editingEvent}
												newEventTitle={newEventTitle}
												newEventDate={newEventDate}
												newEventEndDate={newEventEndDate}
												newEventTime={newEventTime}
												newEventEndTime={newEventEndTime}
												newEventDescription={newEventDescription}
												newEventColor={newEventColor}
												newEventRecurrence={newEventRecurrence}
												newEventReminderMinutes={newEventReminderMinutes}
												eventColors={eventColors}
												onTitleChange={setNewEventTitle}
												onDateChange={setNewEventDate}
												onEndDateChange={setNewEventEndDate}
												onTimeChange={setNewEventTime}
												onEndTimeChange={setNewEventEndTime}
												onDescriptionChange={setNewEventDescription}
												onColorChange={setNewEventColor}
												onRecurrenceChange={setNewEventRecurrence}
												onReminderChange={setNewEventReminderMinutes}
												onSubmit={handleCreateEvent}
												onCancel={() => handleDialogOpenChange(false)}
											/>
										</DialogContent>
									</Dialog>
								</div>

								{/* Événements */}
								<div
									ref={selectedEventsScrollRef}
									className='flex w-full flex-col gap-2'
								>
									{sortedSelectedDateEvents.length === 0 ? (
										<p className='text-sm text-muted-foreground'>
											Aucun événement
										</p>
									) : shouldVirtualizeSelected &&
									  selectedEventsScrollRef.current ? (
										<div
											style={{
												height: `${selectedEventsVirtualizer.getTotalSize()}px`,
												width: "100%",
												position: "relative",
											}}
										>
											{selectedEventsVirtualizer
												.getVirtualItems()
												.map(
													(virtualItem: {
														index: number;
														size: number;
														start: number;
													}) => {
														const event =
															sortedSelectedDateEvents[virtualItem.index];
														return (
															<div
																key={event.id}
																style={{
																	position: "absolute",
																	top: 0,
																	left: 0,
																	width: "100%",
																	height: `${virtualItem.size}px`,
																	transform: `translateY(${virtualItem.start}px)`,
																}}
																className='mb-2'
															>
																<EventItem
																	event={event}
																	onEdit={() => handleEditEvent(event)}
																	onDelete={async () => {
																		pushEventToGoogle(event, "delete").catch(
																			(err) => {
																				logger.error(
																					"Erreur push Google:",
																					err
																				);
																			}
																		);
																		deleteEvent(event.id);
																	}}
																	onDragStart={() =>
																		handleEventDragStart(event.id)
																	}
																	onDragEnd={handleEventDragEnd}
																	isDragging={draggedEventId === event.id}
																/>
															</div>
														);
													}
												)}
										</div>
									) : (
										sortedSelectedDateEvents.map(
											(event: (typeof sortedSelectedDateEvents)[0]) => (
												<EventItem
													key={event.id}
													event={event}
													onEdit={() => handleEditEvent(event)}
													onDelete={async () => {
														pushEventToGoogle(event, "delete").catch((err) => {
															logger.error("Erreur push Google:", err);
														});
														deleteEvent(event.id);
													}}
													onDragStart={() => handleEventDragStart(event.id)}
													onDragEnd={handleEventDragEnd}
													isDragging={draggedEventId === event.id}
												/>
											)
										)
									)}
								</div>
							</CardFooter>
						)
					)}
				</>
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

export const CalendarWidget = memo(CalendarWidgetComponent);

// WeekView et DayView sont maintenant intégrés dans calendar-full
// Ces composants ont été supprimés et déplacés dans calendar-full.tsx
