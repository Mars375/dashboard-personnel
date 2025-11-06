import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BookmarksWidget } from "@/widgets/Bookmarks/BookmarksWidget";

// Mock UI components
vi.mock("@/components/ui/card", () => ({
	Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}), { virtual: true });

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, ...props }: any) => (
		<button onClick={onClick} {...props}>{children}</button>
	),
}), { virtual: true });

vi.mock("@/components/ui/input", () => ({
	Input: (props: any) => <input {...props} />,
}), { virtual: true });

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: any) => open ? <div role="dialog">{children}</div> : null,
	DialogContent: ({ children }: any) => <div>{children}</div>,
	DialogDescription: ({ children }: any) => <div>{children}</div>,
	DialogFooter: ({ children }: any) => <div>{children}</div>,
	DialogHeader: ({ children }: any) => <div>{children}</div>,
	DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}), { virtual: true });

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
}), { virtual: true });

// Mock storage
vi.mock("@/store/bookmarksStorage", () => ({
	loadBookmarks: vi.fn(() => []),
	addBookmark: vi.fn(),
	updateBookmark: vi.fn(),
	deleteBookmark: vi.fn(),
	getFaviconUrl: vi.fn(() => ""),
}));

describe("BookmarksWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders without crashing", () => {
		render(<BookmarksWidget />);
		expect(screen.getByText(/Aucun bookmark/i)).toBeInTheDocument();
	});

	it("renders with compact size", () => {
		render(<BookmarksWidget size="compact" />);
		expect(screen.getByText(/Aucun bookmark/i)).toBeInTheDocument();
	});

	it("renders with full size", () => {
		render(<BookmarksWidget size="full" />);
		expect(screen.getByPlaceholderText(/Rechercher/i)).toBeInTheDocument();
	});
});


