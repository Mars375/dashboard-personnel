import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies (same as smoke test)
vi.mock("@/components/ui/card", () => ({ Card: ({ children, ...p }: any) => <div {...p}>{children}</div> }), { virtual: true });
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...p }: any) => <button {...p}>{children}</button> }), { virtual: true });
vi.mock("@/components/ui/input", () => ({ Input: (props: any) => <input {...props} /> }), { virtual: true });
vi.mock("@/components/ui/progress", () => ({ Progress: (props: any) => <div role="progressbar" {...props} /> }), { virtual: true });
vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: any) => <div>{children}</div>,
	TooltipTrigger: ({ children }: any) => <div>{children}</div>,
	TooltipContent: ({ children }: any) => <div>{children}</div>,
	TooltipProvider: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });
vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children }: any) => <div>{children}</div>,
	DialogContent: ({ children }: any) => <div>{children}</div>,
	DialogHeader: ({ children }: any) => <div>{children}</div>,
	DialogTitle: ({ children }: any) => <div>{children}</div>,
	DialogDescription: ({ children }: any) => <div>{children}</div>,
	DialogFooter: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });
vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
	DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
}), { virtual: true });
vi.mock("@/components/ui/chart", () => ({
	ChartContainer: ({ children }: any) => <div>{children}</div>,
	ChartTooltip: ({ children }: any) => <div>{children}</div>,
	ChartTooltipContent: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });
vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children, open, onOpenChange }: any) => {
		const [isOpen, setIsOpen] = React.useState(open || false);
		React.useEffect(() => {
			if (onOpenChange && open !== undefined) {
				setIsOpen(open);
			}
		}, [open, onOpenChange]);
		return (
			<div>
				{React.Children.map(children, (child: any) => {
					if (child?.props?.asChild) {
						// PopoverTrigger
						return React.cloneElement(child.props.children, {
							onClick: () => {
								setIsOpen(!isOpen);
								if (onOpenChange) onOpenChange(!isOpen);
							},
						});
					}
					if (isOpen && child?.type?.name !== "PopoverTrigger") {
						// PopoverContent when open
						return child;
					}
					return null;
				})}
			</div>
		);
	},
	PopoverTrigger: ({ children, asChild, ...props }: any) => {
		if (asChild && React.isValidElement(children)) {
			return React.cloneElement(children, {
				...props,
				onClick: (e: any) => {
					if (children.props.onClick) children.props.onClick(e);
					if (props.onClick) props.onClick(e);
				},
			});
		}
		return <div onClick={props.onClick}>{children}</div>;
	},
	PopoverContent: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }), { virtual: true });
vi.mock("framer-motion", () => ({ motion: { div: (props: any) => <div {...props} /> } }), { virtual: true });
vi.mock("recharts", () => ({
	PieChart: ({ children }: any) => <div>{children}</div>,
	Pie: ({ children }: any) => <div>{children}</div>,
	Cell: () => null,
}), { virtual: true });

const todos = [
	{ id: "1", title: "Active task", completed: false, priority: false, createdAt: Date.now() },
	{ id: "2", title: "Completed task", completed: true, priority: false, createdAt: Date.now() },
	{ id: "3", title: "Priority task", completed: false, priority: true, createdAt: Date.now() },
];

const mockFilteredTodos = vi.fn((filter: string, search?: string) => {
	if (search) {
		return todos.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
	}
	switch (filter) {
		case "active":
			return todos.filter((t) => !t.completed);
		case "completed":
			return todos.filter((t) => t.completed);
		case "priority":
			return todos.filter((t) => t.priority);
		default:
			return todos;
	}
});

vi.mock("@/hooks/useTodos", () => ({
	useTodos: () => ({
		todos,
		currentListId: "pro",
		lists: [{ id: "pro", name: "Pro", createdAt: Date.now() }],
		setCurrentList: vi.fn(),
		addList: vi.fn(),
		renameList: vi.fn(),
		deleteList: vi.fn(),
		addTodo: vi.fn(),
		toggleTodo: vi.fn(),
		deleteTodo: vi.fn(),
		editTodo: vi.fn(),
		togglePriority: vi.fn(),
		setDeadline: vi.fn(),
		filteredTodos: mockFilteredTodos,
		activeCount: 2,
		completedCount: 1,
		priorityCount: 1,
		overdueCount: 0,
		undo: vi.fn(),
		redo: vi.fn(),
		canUndo: false,
		canRedo: false,
	}),
}), { virtual: true });

vi.mock("@/store/todoStorage", () => ({
	saveTodos: vi.fn(),
	loadTodos: () => [],
}), { virtual: true });

vi.mock("@/lib/notifications", () => ({
	requestNotificationPermission: vi.fn().mockResolvedValue("granted"),
	getNotificationPermission: vi.fn().mockReturnValue("granted"),
	loadNotificationSettings: vi.fn().mockReturnValue({
		enabled: true,
		permission: "granted",
		remindBeforeDays: [0, 1],
		checkInterval: 15,
	}),
	saveNotificationSettings: vi.fn(),
	checkAndSendNotifications: vi.fn(),
}), { virtual: true });

vi.mock("@/lib/sync/syncManager", () => ({
	syncManager: {
		syncAll: vi.fn().mockResolvedValue(undefined),
	},
}), { virtual: true });

beforeEach(() => {
	mockFilteredTodos.mockClear();
	mockFilteredTodos.mockImplementation((filter: string, search?: string) => {
		if (search) {
			return todos.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
		}
		switch (filter) {
			case "active":
				return todos.filter((t) => !t.completed);
			case "completed":
				return todos.filter((t) => t.completed);
			case "priority":
				return todos.filter((t) => t.priority);
			default:
				return todos;
		}
	});
	const store: Record<string, string> = {};
	vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
		store[key] = value;
	});
	vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
		return store[key] ?? null;
	});
	global.Notification = {
		permission: "granted",
		requestPermission: vi.fn().mockResolvedValue("granted"),
	} as any;
});

import { TodoWidget } from "@/widgets/Todo/TodoWidget";

describe("TodoWidget - Filter", () => {
	it("filters by active tasks", async () => {
		const user = userEvent.setup();
		render(<TodoWidget />);

		const activeButton = screen.getByText("Actives");
		await user.click(activeButton);

		expect(mockFilteredTodos).toHaveBeenCalledWith("active", "");
	});

	it("filters by completed tasks", async () => {
		const user = userEvent.setup();
		render(<TodoWidget />);

		const completedButton = screen.getByText("Terminées");
		await user.click(completedButton);

		expect(mockFilteredTodos).toHaveBeenCalledWith("completed", "");
	});

	it("filters by priority tasks", async () => {
		const user = userEvent.setup();
		render(<TodoWidget size="full" />); // Use full size to show priority filter

		const priorityButton = screen.getByText("Prioritaires");
		await user.click(priorityButton);

		expect(mockFilteredTodos).toHaveBeenCalledWith("priority", "");
	});

	it("searches todos by title", async () => {
		const user = userEvent.setup();
		render(<TodoWidget size="medium" />); // Use medium size to show search

		// The search input is in a Popover, so we need to click the search button first
		const searchButton = screen.getByLabelText("Rechercher");
		await user.click(searchButton);

		// Wait for the popover to open and find the input
		await waitFor(() => {
			const searchInput = screen.getByPlaceholderText("Rechercher...");
			expect(searchInput).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText("Rechercher...");
		await user.type(searchInput, "Active");

		expect(mockFilteredTodos).toHaveBeenCalledWith("all", "Active");
	});
});

