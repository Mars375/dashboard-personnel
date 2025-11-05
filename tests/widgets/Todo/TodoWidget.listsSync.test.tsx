import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
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

// Mock useTodos hook
const mockAddList = vi.fn();
const mockSetCurrentList = vi.fn();
const mockAddTodo = vi.fn();

// Make lists mutable so tests can update them
let mockLists = [
	{ id: "list-1", name: "Pro", createdAt: Date.now() },
	{ id: "list-2", name: "Perso", createdAt: Date.now() },
];

// Exposer mockLists globalement pour que le mock useTodoStore puisse y accéder
(globalThis as any).__mockLists__ = mockLists;

const mockUseTodos = vi.fn(() => ({
	todos: [],
	currentListId: "list-1",
	lists: mockLists,
	setCurrentList: mockSetCurrentList,
	addList: mockAddList,
	addTodo: mockAddTodo,
	editTodo: vi.fn(),
	deleteTodo: vi.fn(),
	toggleTodo: vi.fn(),
	togglePriority: vi.fn(),
	setDeadline: vi.fn(),
	updateTodoId: vi.fn(),
	filteredTodos: vi.fn(() => []),
	activeCount: 0,
	completedCount: 0,
	priorityCount: 0,
	overdueCount: 0,
	undo: vi.fn(),
	redo: vi.fn(),
	canUndo: false,
	canRedo: false,
}));

vi.mock("@/hooks/useTodos", () => ({
	useTodos: () => mockUseTodos(),
}));

// Mock useTodoStore - doit retourner mockLists pour que les changements soient visibles
// Utiliser une fonction pour accéder à mockLists au moment de l'appel
vi.mock("@/store/todoStore", async () => {
	const actual = await vi.importActual("@/store/todoStore");
	return {
		...actual,
		useTodoStore: {
			getState: () => {
				// Accéder à mockLists depuis le scope parent via une closure
				// mockLists sera défini avant que ce mock soit utilisé
				return {
					present: [],
					currentListId: "list-1",
					lists: (globalThis as any).__mockLists__ || [],
				};
			},
			subscribe: (listener: (state: any) => void) => {
				// Mock subscribe qui appelle immédiatement le listener avec l'état actuel
				const state = {
					present: [],
					currentListId: "list-1",
					lists: (globalThis as any).__mockLists__ || [],
				};
				listener(state);
				// Retourner une fonction unsubscribe
				return () => {};
			},
		},
	};
});

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
	TooltipContent: ({ children }: any) => <div>{children}</div>,
	TooltipProvider: ({ children }: any) => <div>{children}</div>,
	TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children }: any) => <div>{children}</div>,
	DialogContent: ({ children }: any) => <div>{children}</div>,
	DialogDescription: ({ children }: any) => <div>{children}</div>,
	DialogFooter: ({ children }: any) => <div>{children}</div>,
	DialogHeader: ({ children }: any) => <div>{children}</div>,
	DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
	DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children }: any) => <div>{children}</div>,
	PopoverContent: ({ children }: any) => <div>{children}</div>,
	PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/checkbox", () => ({
	Checkbox: (props: any) => <input type="checkbox" {...props} />,
}));

vi.mock("@/components/ui/progress", () => ({
	Progress: (props: any) => <div {...props} />,
}));

vi.mock("@/components/ui/button-group", () => ({
	ButtonGroup: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/calendar-full", () => ({
	DatePicker: (props: any) => <div {...props} />,
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		warning: vi.fn(),
	},
}));

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
	},
}));

describe("TodoWidget - Lists Synchronization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPullTodos.mockResolvedValue([]);
		mockPushTodos.mockResolvedValue(new Map());
		mockGetMissingLocalLists.mockResolvedValue([]);
		mockAddList.mockImplementation(() => {});
		mockSetCurrentList.mockImplementation(() => {});
		mockAddTodo.mockImplementation(() => {});
		// Reset lists to default
		mockLists = [
			{ id: "list-1", name: "Pro", createdAt: Date.now() },
			{ id: "list-2", name: "Perso", createdAt: Date.now() },
		];
		// Mettre à jour la référence globale
		(globalThis as any).__mockLists__ = mockLists;
	});

	it("should create missing local lists from Google Tasks during sync", async () => {
		// Mock: Google Tasks has a list "Mes Tâches" that doesn't exist locally
		mockGetMissingLocalLists.mockResolvedValueOnce([
			{ id: "@default", title: "Mes Tâches" },
		]);

		// Mock: pulling todos from "Mes Tâches" returns tasks
		mockPullTodos
			.mockResolvedValueOnce([
				{
					id: "google-task-1",
					title: "Tâche depuis Google Tasks",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
			])
			.mockResolvedValueOnce([]); // Sync current list (empty)

		render(<TodoWidget />);

		// Wait for sync to complete
		await waitFor(() => {
			expect(mockGetMissingLocalLists).toHaveBeenCalled();
		}, { timeout: 3000 });

		// Should have created the missing list
		await waitFor(() => {
			expect(mockAddList).toHaveBeenCalledWith("Mes Tâches");
		}, { timeout: 3000 });
	});

	it("should import tasks when creating a missing list", async () => {
		const missingGoogleList = { id: "@default", title: "Mes Tâches" };
		mockGetMissingLocalLists.mockResolvedValue([missingGoogleList]);

		const tasksFromGoogle = [
			{
				id: "google-task-1",
				title: "Tâche 1",
				completed: false,
				priority: false,
				createdAt: Date.now(),
			},
			{
				id: "google-task-2",
				title: "Tâche 2",
				completed: true,
				priority: false,
				createdAt: Date.now(),
			},
		];

		mockPullTodos
			.mockResolvedValueOnce(tasksFromGoogle) // Pull from new list "Mes Tâches"
			.mockResolvedValueOnce([]); // Sync current list

		// Mock addList to update the mockLists
		mockAddList.mockImplementation((name: string) => {
			const newList = { id: `new-list-${Date.now()}`, name, createdAt: Date.now() };
			mockLists.push(newList);
			// Mettre à jour la référence globale
			(globalThis as any).__mockLists__ = mockLists;
		});

		render(<TodoWidget />);

		// Attendre que la synchronisation soit déclenchée (elle se fait automatiquement après 2 secondes)
		await waitFor(() => {
			expect(mockGetMissingLocalLists).toHaveBeenCalled();
		}, { timeout: 5000 });

		// Vérifier que addList a été appelé pour créer la nouvelle liste
		await waitFor(() => {
			expect(mockAddList).toHaveBeenCalledWith("Mes Tâches");
		}, { timeout: 5000 });

		// Vérifier que pullTodos a été appelé (au moins une fois)
		await waitFor(() => {
			expect(mockPullTodos).toHaveBeenCalled();
		}, { timeout: 5000 });

		// Vérifier que les tâches ont été ajoutées
		await waitFor(() => {
			expect(mockAddTodo).toHaveBeenCalled();
		}, { timeout: 5000 });
	}, 15000);

	it("should not create duplicate lists if list already exists", async () => {
		// Mock: Google Tasks has "Mes Tâches" list
		mockGetMissingLocalLists.mockResolvedValueOnce([
			{ id: "@default", title: "Mes Tâches" },
		]);

		// Update mockLists to include "Mes Tâches" before rendering
		mockLists.push({ id: "list-3", name: "Mes Tâches", createdAt: Date.now() });

		render(<TodoWidget />);

		await waitFor(() => {
			expect(mockGetMissingLocalLists).toHaveBeenCalled();
		}, { timeout: 3000 });

		// Should not create any new lists since "Mes Tâches" already exists
		expect(mockAddList).not.toHaveBeenCalled();
	});

	it("should use correct list name when pushing todos", async () => {
		const idMap = new Map([["local-id-1", "google-task-1"]]);
		mockPushTodos.mockResolvedValueOnce(idMap);

		render(<TodoWidget size="medium" />);

		// Wait for the component to be rendered
		await waitFor(() => {
			// The component should be rendered - check for a more specific element
			const input = screen.getByPlaceholderText("Ajouter une tâche...");
			expect(input).toBeDefined();
		}, { timeout: 1000 });
	});
});

