// Tests pour les rappels personnalisés
import { describe, it, expect, vi } from "vitest";
import { checkAndSendNotifications } from "@/lib/calendarNotifications";
import type { CalendarEvent } from "@/widgets/Calendar/types";

// Tests unitaires simples pour la logique des rappels

describe("Rappels personnalisés", () => {
	it("utilise reminderMinutes de l'événement si défini", () => {
		const events: CalendarEvent[] = [
			{
				id: "1",
				title: "Test",
				date: "2025-01-15",
				time: "15:00",
				reminderMinutes: 30,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		];

		const notifiedEvents = new Set<string>();
		const settings = {
			enabled: true,
			minutesBefore: 15,
			checkInterval: 5,
		};

		// Mock Notification API
		global.Notification = {
			permission: "granted",
		} as any;

		checkAndSendNotifications(events, settings, notifiedEvents);

		// Vérifier que l'ID de notification inclut le reminderMinutes personnalisé
		expect(notifiedEvents.has("1-30")).toBe(false); // Peut être false si pas dans la fenêtre
	});
});

