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
	CardHeader: ({ children, ...p }: any) => <div {...p}>{children}</div>,
	CardContent: ({ children, ...p }: any) => <div {...p}>{children}</div>,
	CardFooter: ({ children, ...p }: any) => <div {...p}>{children}</div>,
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

vi.mock("@/components/ui/button-group", () => ({
	ButtonGroup: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}), { virtual: true });

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children, asChild }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children, onClick }: any) => (
		<div onClick={onClick}>{children}</div>
	),
	DropdownMenuSeparator: () => <hr />,
}), { virtual: true });

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
	},
}));

vi.mock("@/hooks/useTodos", () => ({
	useTodos: () => ({
		todos: [],
		filteredTodos: () => [],
		addTodo: vi.fn(),
		toggleComplete: vi.fn(),
		deleteTodo: vi.fn(),
		updateTodo: vi.fn(),
		togglePriority: vi.fn(),
		setFilter: vi.fn(),
		setSearchQuery: vi.fn(),
	}),
}));

vi.mock("date-fns", () => ({
	format: (date: Date, formatStr: string) => {
		return date.toLocaleDateString("fr-FR");
	},
}));

vi.mock("date-fns/locale", () => ({
	fr: {},
}));

describe("CalendarWidget", () => {
	it("renders without crashing", () => {
		const { container } = render(<CalendarWidget />);
		expect(container).toBeTruthy();
	});

	it("displays calendar component", () => {
		const { getByTestId } = render(<CalendarWidget />);
		expect(getByTestId("calendar")).toBeTruthy();
	});

	it("displays header with today button", () => {
		const { getByText } = render(<CalendarWidget />);
		expect(getByText(/Aujourd'hui/)).toBeTruthy();
	});
});

