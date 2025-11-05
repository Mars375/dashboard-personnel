// Tests pour la recherche d'événements
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { CalendarWidget } from "@/widgets/Calendar/CalendarWidget";
import type { CalendarEvent } from "@/widgets/Calendar/types";

const mockEvents: CalendarEvent[] = [
	{
		id: "1",
		title: "Réunion équipe",
		date: "2025-01-15",
		description: "Réunion importante",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "2",
		title: "Rendez-vous client",
		date: "2025-01-20",
		description: "Présentation produit",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "3",
		title: "Formation",
		date: "2025-02-01",
		time: "14:00",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

// Mock des hooks
const mockAddEvent = vi.fn();
const mockUpdateEvent = vi.fn();
const mockDeleteEvent = vi.fn();
const mockSetView = vi.fn();
const mockGetEventsForDate = vi.fn((date: Date) => {
	const dateStr = date.toISOString().split("T")[0];
	return mockEvents.filter((e) => e.date === dateStr);
});

vi.mock("@/hooks/useCalendar", () => ({
	useCalendar: () => ({
		currentDate: new Date(2025, 0, 15),
		setCurrentDate: vi.fn(),
		getEventsForDate: mockGetEventsForDate,
		events: mockEvents,
		addEvent: mockAddEvent,
		updateEvent: mockUpdateEvent,
		deleteEvent: mockDeleteEvent,
		view: "month",
		setView: mockSetView,
	}),
}));

vi.mock("@/hooks/useTodos", () => ({
	useTodos: () => ({
		todos: [],
	}),
}));

vi.mock("@/components/ui/card", () => ({
	Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
	CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/calendar-full", () => ({
	Calendar: () => <div data-testid="calendar">Calendar</div>,
	DatePicker: ({ selected, onSelect, ...p }: any) => (
		<div data-testid="date-picker" {...p}>
			<div>DatePicker Component</div>
			{selected && <div data-testid="selected-date">{selected.toISOString()}</div>}
		</div>
	),
}));

describe("CalendarWidget - Recherche d'événements", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("affiche la barre de recherche", () => {
		render(<CalendarWidget size="full" />);

		const searchInput = screen.getByPlaceholderText(/rechercher un événement/i);
		expect(searchInput).toBeInTheDocument();
	});

	it("filtre les événements par titre", async () => {
		const user = userEvent.setup();
		render(<CalendarWidget size="full" />);

		const searchInput = screen.getByPlaceholderText(/rechercher un événement/i);
		
		await user.type(searchInput, "Réunion");

		// Vérifier que les résultats sont affichés
		const resultsHeader = screen.getByText(/résultats de recherche/i);
		expect(resultsHeader).toBeInTheDocument();
		
		// Vérifier qu'on trouve "Réunion équipe"
		expect(screen.getByText(/réunion équipe/i)).toBeInTheDocument();
		// Mais pas "Rendez-vous client"
		expect(screen.queryByText(/rendez-vous client/i)).not.toBeInTheDocument();
	});

	it("filtre les événements par description", async () => {
		const user = userEvent.setup();
		render(<CalendarWidget size="full" />);

		const searchInput = screen.getByPlaceholderText(/rechercher un événement/i);
		
		await user.type(searchInput, "important");

		const resultsHeader = screen.getByText(/résultats de recherche/i);
		expect(resultsHeader).toBeInTheDocument();
		
		expect(screen.getByText(/réunion équipe/i)).toBeInTheDocument();
	});

	it("affiche 'Aucun événement trouvé' quand aucun résultat", async () => {
		const user = userEvent.setup();
		render(<CalendarWidget size="full" />);

		const searchInput = screen.getByPlaceholderText(/rechercher un événement/i);
		
		await user.type(searchInput, "Inexistant");

		expect(screen.getByText(/aucun événement trouvé/i)).toBeInTheDocument();
	});

	it("affiche le nombre de résultats", async () => {
		const user = userEvent.setup();
		render(<CalendarWidget size="full" />);

		const searchInput = screen.getByPlaceholderText(/rechercher un événement/i);
		
		await user.type(searchInput, "Réunion");

		// Vérifier que le compteur affiche (1)
		expect(screen.getByText(/résultats de recherche \(1\)/i)).toBeInTheDocument();
	});

	it("affiche la date et l'heure des résultats", async () => {
		const user = userEvent.setup();
		render(<CalendarWidget size="full" />);

		const searchInput = screen.getByPlaceholderText(/rechercher un événement/i);
		
		await user.type(searchInput, "Formation");

		// Vérifier que la date est affichée
		expect(screen.getByText(/2025/i)).toBeInTheDocument();
		// Vérifier que l'heure est affichée si présente (il peut y avoir plusieurs occurrences)
		expect(screen.getAllByText(/14:00/i).length).toBeGreaterThan(0);
	});

	it("affiche les événements du jour sélectionné quand pas de recherche", () => {
		render(<CalendarWidget size="full" />);

		// Quand pas de recherche, devrait afficher les événements normalement
		const searchInput = screen.getByPlaceholderText(/rechercher un événement/i);
		expect(searchInput.value).toBe("");
		
		// Ne devrait pas avoir "Résultats de recherche" visible
		expect(screen.queryByText(/résultats de recherche/i)).not.toBeInTheDocument();
	});
});

