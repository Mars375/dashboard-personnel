// Tests pour la répétition d'événements
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarWidget } from "@/widgets/Calendar/CalendarWidget";
import { isDateInRecurrence } from "@/lib/calendarRecurrence";
import type { CalendarEvent } from "@/widgets/Calendar/types";
import * as React from "react";

// Mock complet des dépendances
vi.mock("@/hooks/useCalendar");
vi.mock("@/hooks/useTodos");
vi.mock("@/components/ui/card");
vi.mock("@/components/ui/calendar-full");
vi.mock("@/components/ui/button");
vi.mock("@/components/ui/button-group");
vi.mock("@/components/ui/dialog");
vi.mock("@/components/ui/dropdown-menu");
vi.mock("@/components/ui/input");
vi.mock("@/components/ui/label");
vi.mock("@/components/ui/popover");
vi.mock("sonner");
vi.mock("framer-motion");
vi.mock("@/lib/calendarExport");
vi.mock("@/lib/calendarNotifications");
vi.mock("@/lib/sync/calendarSyncManager");
vi.mock("@/lib/calendarRecurrence", async () => {
	const actual = await vi.importActual("@/lib/calendarRecurrence");
	return actual;
});

// Mock simplifié pour les tests
const mockUseCalendar = {
	currentDate: new Date(2025, 0, 15),
	setCurrentDate: vi.fn(),
	getEventsForDate: vi.fn(() => []),
	events: [],
	addEvent: vi.fn(),
	updateEvent: vi.fn(),
	deleteEvent: vi.fn(),
	view: "month" as const,
	setView: vi.fn(),
};

vi.mock("@/hooks/useCalendar", () => ({
	useCalendar: () => mockUseCalendar,
}));

vi.mock("@/hooks/useTodos", () => ({
	useTodos: () => ({ todos: [] }),
}));

// Tests simplifiés qui se concentrent sur la logique de répétition

describe("isDateInRecurrence", () => {
	it("retourne true pour une date exacte sans répétition", () => {
		const event: CalendarEvent = {
			id: "1",
			title: "Test",
			date: "2025-01-15",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		const date = new Date(2025, 0, 15); // 15 janvier 2025
		expect(isDateInRecurrence(date, event)).toBe(true);

		const otherDate = new Date(2025, 0, 16);
		expect(isDateInRecurrence(otherDate, event)).toBe(false);
	});

	it("retourne true pour une date dans une répétition quotidienne", () => {
		const event: CalendarEvent = {
			id: "1",
			title: "Test",
			date: "2025-01-15",
			recurrence: { type: "daily", interval: 1 },
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		expect(isDateInRecurrence(new Date(2025, 0, 15), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 0, 16), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 0, 17), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 0, 14), event)).toBe(false); // Avant la date de début
	});

	it("retourne true pour une date dans une répétition hebdomadaire", () => {
		const event: CalendarEvent = {
			id: "1",
			title: "Test",
			date: "2025-01-15", // Mercredi
			recurrence: { type: "weekly", interval: 1 },
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		expect(isDateInRecurrence(new Date(2025, 0, 15), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 0, 22), event)).toBe(true); // Mercredi suivant
		expect(isDateInRecurrence(new Date(2025, 0, 29), event)).toBe(true); // Mercredi suivant
		expect(isDateInRecurrence(new Date(2025, 0, 16), event)).toBe(false); // Jeudi
	});

	it("retourne true pour une date dans une répétition mensuelle", () => {
		const event: CalendarEvent = {
			id: "1",
			title: "Test",
			date: "2025-01-15",
			recurrence: { type: "monthly", interval: 1 },
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		expect(isDateInRecurrence(new Date(2025, 0, 15), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 1, 15), event)).toBe(true); // Février
		expect(isDateInRecurrence(new Date(2025, 2, 15), event)).toBe(true); // Mars
		expect(isDateInRecurrence(new Date(2025, 1, 16), event)).toBe(false); // 16 février
	});

	it("retourne true pour une date dans une répétition annuelle", () => {
		const event: CalendarEvent = {
			id: "1",
			title: "Test",
			date: "2025-01-15",
			recurrence: { type: "yearly", interval: 1 },
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		expect(isDateInRecurrence(new Date(2025, 0, 15), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2026, 0, 15), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2027, 0, 15), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 1, 15), event)).toBe(false); // Février
	});

	it("respecte la date de fin de répétition", () => {
		const event: CalendarEvent = {
			id: "1",
			title: "Test",
			date: "2025-01-15",
			recurrence: { type: "daily", interval: 1, endDate: "2025-01-17" },
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		expect(isDateInRecurrence(new Date(2025, 0, 15), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 0, 16), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 0, 17), event)).toBe(true);
		expect(isDateInRecurrence(new Date(2025, 0, 18), event)).toBe(false); // Après la fin
	});
});

