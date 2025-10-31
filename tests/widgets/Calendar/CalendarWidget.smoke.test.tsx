// Smoke test pour CalendarWidget
import React from "react";
import { render } from "@testing-library/react";
import { CalendarWidget } from "@/widgets/Calendar/CalendarWidget";

// Mock du hook useCalendar
vi.mock("@/hooks/useCalendar", () => ({
	useCalendar: () => ({
		currentDate: new Date(2024, 0, 15), // 15 janvier 2024
		view: "month" as const,
		events: [],
		goToPreviousMonth: vi.fn(),
		goToNextMonth: vi.fn(),
		goToToday: vi.fn(),
		setCurrentDate: vi.fn(),
		setView: vi.fn(),
		addEvent: vi.fn(),
		updateEvent: vi.fn(),
		deleteEvent: vi.fn(),
		getEventsForDate: vi.fn(() => []),
		getEventsForMonth: vi.fn(() => []),
	}),
}));

// Mock des composants shadcn/ui
vi.mock("@/components/ui/card", () => ({
	Card: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}), { virtual: true });

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, ...p }: any) => (
		<button onClick={onClick} {...p}>
			{children}
		</button>
	),
}), { virtual: true });

vi.mock("@/components/ui/calendar", () => ({
	Calendar: ({ selected, onSelect, ...p }: any) => (
		<div data-testid="calendar" {...p}>
			<div>Calendar Component</div>
			{selected && <div data-testid="selected-date">{selected.toISOString()}</div>}
		</div>
	),
}), { virtual: true });

describe("CalendarWidget", () => {
	it("renders without crashing", () => {
		const { container } = render(<CalendarWidget />);
		expect(container).toBeTruthy();
	});

	it("displays calendar component", () => {
		const { getByTestId } = render(<CalendarWidget />);
		expect(getByTestId("calendar")).toBeTruthy();
	});

	it("displays header with title and today button", () => {
		const { getByText } = render(<CalendarWidget />);
		expect(getByText(/Calendrier/)).toBeTruthy();
		expect(getByText(/Aujourd'hui/)).toBeTruthy();
	});
});

