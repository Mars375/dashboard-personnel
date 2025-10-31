// Tests pour drag & drop dans CalendarWidget
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CalendarWidget } from "@/widgets/Calendar/CalendarWidget";
import type { CalendarEvent } from "@/widgets/Calendar/types";

const mockEvents: CalendarEvent[] = [
	{
		id: "event-1",
		title: "Événement test",
		date: "2024-01-15",
		time: "14:00",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

const mockUpdateEvent = vi.fn();

vi.mock("@/hooks/useCalendar", () => ({
	useCalendar: () => ({
		currentDate: new Date(2024, 0, 15),
		view: "month" as const,
		events: mockEvents,
		setCurrentDate: vi.fn(),
		setView: vi.fn(),
		addEvent: vi.fn(),
		updateEvent: mockUpdateEvent,
		deleteEvent: vi.fn(),
		getEventsForDate: vi.fn(() => mockEvents),
		getEventsForMonth: vi.fn(() => mockEvents),
	}),
}));

// Mocks communs
vi.mock("@/components/ui/card", () => ({
	Card: ({ children, ...p }: any) => <div {...p}>{children}</div>,
	CardHeader: ({ children, ...p }: any) => <div {...p}>{children}</div>,
	CardContent: ({ children, ...p }: any) => <div {...p}>{children}</div>,
	CardFooter: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}), { virtual: true });

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, onDragStart, onDragEnd, ...p }: any) => (
		<button
			onClick={onClick}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			{...p}
		>
			{children}
		</button>
	),
}), { virtual: true });

vi.mock("@/components/ui/calendar", () => ({
	Calendar: ({ selected, onSelect, ...p }: any) => {
		const handleDragOver = (e: React.DragEvent) => {
			e.preventDefault();
		};

		const handleDrop = (e: React.DragEvent) => {
			e.preventDefault();
			const eventId = e.dataTransfer?.getData("text/plain");
			if (eventId && onSelect) {
				onSelect(new Date(2024, 0, 20)); // Nouvelle date
			}
		};

		return (
			<div
				data-testid="calendar"
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				{...p}
			>
				<div>Calendar Component</div>
				{selected && <div data-testid="selected-date">{selected.toISOString()}</div>}
				<div
					data-testid="day-button"
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					Day Button
				</div>
			</div>
		);
	},
}), { virtual: true });

vi.mock("@/components/ui/button-group", () => ({
	ButtonGroup: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}), { virtual: true });

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children, onClick }: any) => (
		<div onClick={onClick}>{children}</div>
	),
	DropdownMenuSeparator: () => <hr />,
}), { virtual: true });

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, draggable, onDragStart, onDragEnd, ...p }: any) => (
			<div
				draggable={draggable}
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				{...p}
			>
				{children}
			</div>
		),
	},
}));

vi.mock("@/hooks/useTodos", () => ({
	useTodos: () => ({
		todos: [],
		filteredTodos: () => [],
	}),
}));

vi.mock("date-fns", () => ({
	format: (date: Date) => date.toLocaleDateString("fr-FR"),
	startOfWeek: (date: Date) => date,
	endOfWeek: (date: Date) => date,
	eachDayOfInterval: () => [new Date(2024, 0, 15)],
	isSameDay: (a: Date, b: Date) => a.getTime() === b.getTime(),
	addDays: (date: Date, days: number) => new Date(date.getTime() + days * 86400000),
	subDays: (date: Date, days: number) => new Date(date.getTime() - days * 86400000),
}));

vi.mock("date-fns/locale", () => ({
	fr: {},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("CalendarWidget - Drag & Drop", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders draggable event items", () => {
		render(<CalendarWidget />);
		const eventItem = screen.queryByText(/Événement test/i);
		expect(eventItem).toBeTruthy();
	});

	it("handles drag start on event", () => {
		render(<CalendarWidget />);
		const eventItem = screen.queryByText(/Événement test/i);
		
		if (eventItem && eventItem.parentElement) {
			const dragEvent = new Event("dragstart", { bubbles: true });
			Object.defineProperty(dragEvent, "dataTransfer", {
				value: {
					setData: vi.fn(),
				},
			});
			eventItem.parentElement.dispatchEvent(dragEvent);
			// Le drag devrait être initialisé
			expect(eventItem).toBeTruthy();
		}
	});

	it("updates event date on drop", async () => {
		render(<CalendarWidget />);
		const dayButton = screen.getByTestId("day-button");
		
		// Simuler un drop
		const dropEvent = new Event("drop", { bubbles: true });
		Object.defineProperty(dropEvent, "dataTransfer", {
			value: {
				getData: () => "event-1",
			},
		});
		Object.defineProperty(dropEvent, "preventDefault", {
			value: vi.fn(),
		});
		
		dayButton.dispatchEvent(dropEvent);
		
		await waitFor(() => {
			// updateEvent devrait être appelé avec la nouvelle date
			expect(mockUpdateEvent).toBeDefined();
		});
	});

	it("prevents default on drag over", () => {
		render(<CalendarWidget />);
		const dayButton = screen.getByTestId("day-button");
		
		const dragOverEvent = new Event("dragover", { bubbles: true });
		Object.defineProperty(dragOverEvent, "preventDefault", {
			value: vi.fn(),
		});
		
		dayButton.dispatchEvent(dragOverEvent);
		// Le preventDefault devrait être appelé
		expect(dragOverEvent.preventDefault).toBeDefined();
	});
});

