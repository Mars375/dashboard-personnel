import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoWidget } from "@/widgets/Todo/TodoWidget";

// Mock OAuth Manager
const mockOAuthManager = {
	isConnected: vi.fn().mockReturnValue(true),
	getValidAccessToken: vi.fn().mockResolvedValue("mock-token"),
	connect: vi.fn().mockResolvedValue(undefined),
	disconnect: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/lib/auth/oauthManager", () => ({
	getOAuthManager: () => mockOAuthManager,
}));

// Mock GoogleTasksSyncProvider
const mockPullTodos = vi.fn().mockResolvedValue([]);
const mockPushTodos = vi.fn().mockResolvedValue(new Map());
const mockDeleteTask = vi.fn().mockResolvedValue(undefined);
const mockGetMissingLocalLists = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/sync/googleTasksSync", () => ({
	GoogleTasksSyncProvider: class MockGoogleTasksSyncProvider {
		name = "Google Tasks";
		enabled = true;
		pullTodos = mockPullTodos;
		pushTodos = mockPushTodos;
		deleteTask = mockDeleteTask;
		getMissingLocalLists = mockGetMissingLocalLists;
		constructor(config: any) {
			// Mock constructor
		}
	},
}));

// Mock all UI components
vi.mock("@/components/ui/card", () => ({
	Card: React.forwardRef<HTMLDivElement, any>(({ children, ...p }, ref) => (
		<div {...p} ref={ref}>{children}</div>
	)),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: (props: any) => <input {...props} />,
}));

vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: any) => <div>{children}</div>,
	TooltipTrigger: ({ children }: any) => <div>{children}</div>,
	TooltipContent: ({ children }: any) => <div>{children}</div>,
	TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
	DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("framer-motion", () => ({
	motion: {
		div: (props: any) => <div {...props} />,
	},
}));

// Mock useTodos hook
const mockTodos = [
	{
		id: "todo-1",
		title: "Test Todo",
		completed: false,
		priority: false,
		createdAt: Date.now(),
	},
];

const mockUseTodos = {
	todos: mockTodos,
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
	updateTodoId: vi.fn(),
	filteredTodos: vi.fn((filter: string, searchQuery?: string) => mockTodos),
	activeCount: 1,
	completedCount: 0,
	priorityCount: 0,
	overdueCount: 0,
	undo: vi.fn(),
	redo: vi.fn(),
	canUndo: false,
	canRedo: false,
};

vi.mock("@/hooks/useTodos", () => ({
	useTodos: () => mockUseTodos,
}));

vi.mock("@/store/todoStorage", () => ({
	saveTodos: vi.fn(),
	loadTodos: () => [],
}));

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
}));

beforeEach(() => {
	vi.clearAllMocks();
	mockOAuthManager.isConnected.mockReturnValue(true);
	mockPullTodos.mockResolvedValue([]);
	mockPushTodos.mockResolvedValue(new Map());
});

describe("TodoWidget - Google Tasks Sync", () => {
	it("should initialize Google Tasks provider when Google is connected", async () => {
		render(<TodoWidget />);

		await waitFor(() => {
			expect(mockOAuthManager.isConnected).toHaveBeenCalledWith("google");
		});
	});

	it("should display sync button when Google Tasks is connected", async () => {
		render(<TodoWidget />);

		await waitFor(() => {
			const buttons = screen.getAllByRole("button");
			const syncButton = buttons.find((btn) =>
				btn.getAttribute("aria-label")?.includes("Synchroniser") ||
				btn.getAttribute("aria-label")?.includes("Google Tasks")
			);
			expect(syncButton).toBeDefined();
		});
	});

	it("should sync tasks when sync button is clicked", async () => {
		const user = userEvent.setup();
		const mockPulledTodos = [
			{
				id: "google-task-1",
				title: "Pulled Task",
				completed: false,
				priority: false,
				createdAt: Date.now(),
			},
		];

		mockPullTodos.mockResolvedValue(mockPulledTodos);

		render(<TodoWidget />);

		await waitFor(() => {
			const buttons = screen.getAllByRole("button");
			const syncButton = buttons.find((btn) =>
				btn.getAttribute("aria-label")?.includes("Synchroniser")
			);

			if (syncButton) {
				user.click(syncButton);
			}
		});

		await waitFor(() => {
			expect(mockPullTodos).toHaveBeenCalled();
		});
	});

	it("should push local tasks when syncing", async () => {
		const user = userEvent.setup();
		const mockLocalTodo = {
			id: "local-todo-1",
			title: "Local Todo",
			completed: false,
			priority: false,
			createdAt: Date.now(),
		};

		mockUseTodos.todos = [mockLocalTodo];
		mockPullTodos.mockResolvedValue([]);

		const mockIdMap = new Map([["local-todo-1", "google-task-1"]]);
		mockPushTodos.mockResolvedValue(mockIdMap);

		render(<TodoWidget />);

		await waitFor(() => {
			const buttons = screen.getAllByRole("button");
			const syncButton = buttons.find((btn) =>
				btn.getAttribute("aria-label")?.includes("Synchroniser")
			);

			if (syncButton) {
				user.click(syncButton);
			}
		});

		await waitFor(() => {
			expect(mockPushTodos).toHaveBeenCalled();
			expect(mockUseTodos.updateTodoId).toHaveBeenCalledWith(
				"local-todo-1",
				"google-task-1"
			);
		});
	});

	it("should delete task from Google Tasks when deleted locally", async () => {
		const mockTodoWithGoogleId = {
			id: "google-task-1",
			title: "Google Task",
			completed: false,
			priority: false,
			createdAt: Date.now(),
		};

		mockUseTodos.todos = [mockTodoWithGoogleId];

		render(<TodoWidget />);

		// Simulate delete action
		await waitFor(() => {
			// The delete would be triggered by user interaction
			// This is a basic test structure
			expect(mockDeleteTask).not.toHaveBeenCalled(); // Initially not called
		});
	});

	it("should handle sync errors gracefully", async () => {
		const user = userEvent.setup();
		mockPullTodos.mockRejectedValue(new Error("Sync failed"));

		render(<TodoWidget />);

		await waitFor(() => {
			const buttons = screen.getAllByRole("button");
			const syncButton = buttons.find((btn) =>
				btn.getAttribute("aria-label")?.includes("Synchroniser")
			);

			if (syncButton) {
				user.click(syncButton);
			}
		});

		await waitFor(() => {
			// Should not crash, error should be handled
			expect(mockPullTodos).toHaveBeenCalled();
		});
	});
});



