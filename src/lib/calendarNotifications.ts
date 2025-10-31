// Gestion des notifications pour les événements du calendrier

import type { CalendarEvent } from "@/widgets/Calendar/types";

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
		console.error("Erreur lors de la sauvegarde des paramètres:", error);
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
	const checkTime = new Date(now.getTime() + settings.minutesBefore * 60 * 1000);

	events.forEach((event) => {
		if (notifiedEvents.has(event.id)) return;

		// Vérifier si l'événement a une heure
		if (!event.time) return;

		const eventDate = new Date(event.date);
		const [hours, minutes] = event.time.split(":");
		eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

		// Vérifier si l'événement est dans la fenêtre de notification
		if (eventDate >= now && eventDate <= checkTime) {
			sendNotification(event);
			notifiedEvents.add(event.id);
		}
	});
}

/**
 * Envoie une notification pour un événement
 */
function sendNotification(event: CalendarEvent): void {
	if (Notification.permission !== "granted") return;

	const title = event.time
		? `🔔 ${event.title} - ${event.time}`
		: `🔔 ${event.title}`;

	const body = event.description || `Événement prévu le ${event.date}`;

	new Notification(title, {
		body,
		icon: "/favicon.ico",
		tag: event.id,
	});
}

