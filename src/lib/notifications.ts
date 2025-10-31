import type { Todo } from "@/store/todoStorage";

export interface NotificationSettings {
	enabled: boolean;
	permission: NotificationPermission;
	remindBeforeDays: number[]; // e.g., [0, 1, 3] = today, 1 day before, 3 days before
	checkInterval: number; // minutes
}

const DEFAULT_SETTINGS: NotificationSettings = {
	enabled: true,
	permission: "default",
	remindBeforeDays: [0, 1], // Today and 1 day before
	checkInterval: 15, // Check every 15 minutes
};

const STORAGE_KEY = "todos:notification-settings" as const;

export function loadNotificationSettings(): NotificationSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return DEFAULT_SETTINGS;
		const parsed = JSON.parse(stored) as NotificationSettings;
		return { ...DEFAULT_SETTINGS, ...parsed };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export function saveNotificationSettings(settings: NotificationSettings): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore errors
	}
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!("Notification" in window)) {
		return "denied";
	}

	const permission = await Notification.requestPermission();
	const settings = loadNotificationSettings();
	settings.permission = permission;
	saveNotificationSettings(settings);
	return permission;
}

export function getNotificationPermission(): NotificationPermission {
	if (!("Notification" in window)) {
		return "denied";
	}
	return Notification.permission;
}

interface DeadlineTodo {
	todo: Todo;
	daysUntil: number;
}

export function getTodosWithUpcomingDeadlines(
	todos: Todo[],
	remindBeforeDays: number[]
): DeadlineTodo[] {
	const now = Date.now();
	const upcoming: DeadlineTodo[] = [];

	for (const todo of todos) {
		if (todo.completed || !todo.deadline) continue;

		const deadlineDate = new Date(todo.deadline);
		deadlineDate.setHours(0, 0, 0, 0);
		const deadlineTime = deadlineDate.getTime();
		const diff = deadlineTime - now;
		const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));

		// Check if deadline is in the remindBeforeDays list
		if (remindBeforeDays.includes(daysUntil)) {
			upcoming.push({ todo, daysUntil });
		}
	}

	return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function createNotification(todo: Todo, daysUntil: number): void {
	if (getNotificationPermission() !== "granted") return;

	const settings = loadNotificationSettings();
	if (!settings.enabled) return;

	let title: string;
	let body: string;

	if (daysUntil < 0) {
		title = `⏰ Deadline dépassée : ${todo.title}`;
		body = `Cette tâche est en retard.`;
	} else if (daysUntil === 0) {
		title = `📅 Deadline aujourd'hui : ${todo.title}`;
		body = `Cette tâche doit être terminée aujourd'hui.`;
	} else {
		title = `📅 Deadline dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""} : ${todo.title}`;
		body = `Date limite : ${todo.deadline ? new Date(todo.deadline).toLocaleDateString("fr-FR") : ""}`;
	}

	const notification = new Notification(title, {
		body,
		icon: "/vite.svg", // You can replace with a custom icon
		tag: `todo-${todo.id}-${daysUntil}`, // Prevent duplicate notifications
		requireInteraction: false,
	});

	// Auto-close after 5 seconds
	setTimeout(() => {
		notification.close();
	}, 5000);
}

export function checkAndSendNotifications(
	todos: Todo[],
	remindBeforeDays: number[],
	alreadyNotified: Set<string>
): void {
	if (getNotificationPermission() !== "granted") return;

	const upcoming = getTodosWithUpcomingDeadlines(todos, remindBeforeDays);

	for (const { todo, daysUntil } of upcoming) {
		const notificationId = `${todo.id}-${daysUntil}`;
		
		// Only notify once per deadline reminder
		if (!alreadyNotified.has(notificationId)) {
			createNotification(todo, daysUntil);
			alreadyNotified.add(notificationId);
		}
	}
}

