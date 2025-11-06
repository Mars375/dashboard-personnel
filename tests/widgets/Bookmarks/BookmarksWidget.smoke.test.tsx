import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BookmarksWidget } from "@/widgets/Bookmarks/BookmarksWidget";
import type { ReactNode } from "react";
import type { MockComponentProps } from "../utils/mockTypes";

// Mock UI components
vi.mock("@/components/ui/card", () => ({
	Card: ({ children, ...props }: MockComponentProps) => <div {...props}>{children}</div>,
}), { virtual: true });

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, ...props }: MockComponentProps & { onClick?: () => void }) => (
		<button onClick={onClick} {...props}>{children}</button>
	),
}), { virtual: true });

vi.mock("@/components/ui/input", () => ({
	Input: (props: Record<string, unknown>) => <input {...props} />,
}), { virtual: true });

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: { children?: ReactNode; open?: boolean }) => open ? <div role="dialog">{children}</div> : null,
	DialogContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	DialogDescription: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	DialogFooter: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	DialogHeader: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	DialogTitle: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
}), { virtual: true });

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	DropdownMenuItem: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => <div onClick={onClick}>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}), { virtual: true });

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: MockComponentProps) => <div {...props}>{children}</div>,
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
		expect(screen.getByText(/Aucun bookmark/i)).toBeTruthy();
	});

	it("renders with compact size", () => {
		render(<BookmarksWidget size="compact" />);
		expect(screen.getByText(/Aucun/i)).toBeTruthy();
	});

	it("renders with full size", () => {
		render(<BookmarksWidget size="full" />);
		expect(screen.getByPlaceholderText(/Rechercher/i)).toBeTruthy();
	});
});


