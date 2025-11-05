// Gestion des notifications pour les événements du calendrier

import type { CalendarEvent } from "@/widgets/Calendar/types";
import { logger } from "@/lib/logger";

export interface CalendarNotificationSettings {
	enabled: boolean;
	minutesBefore: number; // Minutes avant l'événement pour la notification
	checkInterval: number; // Intervalle de vérification en minutes
}

const STORAGE_KEY = "calendar:notification-settings";
const DEFAULT_SETTINGS: CalendarNotificationSettings = {
	enabled: false,
	minutesBefore: 15,
	checkInterval: 5,
};

/**
 * Charge les paramètres de notification depuis localStorage
 */
export function loadNotificationSettings(): CalendarNotificationSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return DEFAULT_SETTINGS;
		return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

/**
 * Sauvegarde les paramètres de notification dans localStorage
 */
export function saveNotificationSettings(settings: CalendarNotificationSettings): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des paramètres:", error);
	}
}

/**
 * Demande la permission de notification
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!("Notification" in window)) {
		return "denied";
	}

	if (Notification.permission === "default") {
		return await Notification.requestPermission();
	}

	return Notification.permission;
}

/**
 * Vérifie les événements à venir et envoie des notifications
 */
export function checkAndSendNotifications(
	events: CalendarEvent[],
	settings: CalendarNotificationSettings,
	notifiedEvents: Set<string>
): void {
	if (!settings.enabled || Notification.permission !== "granted") {
		return;
	}

	const now = new Date();

	events.forEach((event) => {
		// Vérifier si l'événement a une heure
		if (!event.time) return;

		// Utiliser reminderMinutes de l'événement s'il existe, sinon utiliser settings.minutesBefore
		const reminderMinutes = event.reminderMinutes ?? settings.minutesBefore;
		const notificationId = `${event.id}-${reminderMinutes}`;
		
		if (notifiedEvents.has(notificationId)) return;

		const eventDate = new Date(event.date);
		const [hours, minutes] = event.time.split(":");
		eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

		// Vérifier si nous sommes dans la fenêtre de notification (5 minutes de marge)
		const timeDiff = eventDate.getTime() - now.getTime();
		const minutesUntilEvent = timeDiff / (1000 * 60);
		
		if (
			minutesUntilEvent >= reminderMinutes - 2.5 &&
			minutesUntilEvent <= reminderMinutes + 2.5 &&
			eventDate >= now
		) {
			sendNotification(event, reminderMinutes);
			notifiedEvents.add(notificationId);
		}
	});
}

/**
 * Envoie une notification pour un événement
 */
function sendNotification(event: CalendarEvent, minutesBefore: number): void {
	if (Notification.permission !== "granted") return;

	const timeText = minutesBefore === 0 ? "maintenant" : `dans ${minutesBefore} minute${minutesBefore > 1 ? "s" : ""}`;
	const title = event.time
		? `🔔 ${event.title} - ${event.time}`
		: `🔔 ${event.title}`;

	const body = event.description 
		? `${event.description} (${timeText})`
		: `Événement prévu ${timeText}`;

	new Notification(title, {
		body,
		icon: "/favicon.ico",
		tag: `${event.id}-${minutesBefore}`,
	});
}

