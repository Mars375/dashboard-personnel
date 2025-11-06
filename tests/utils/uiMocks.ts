/**
 * Mocks communs pour les composants UI dans les tests
 */

import type { ReactNode } from "react";
import { vi } from "vitest";
import type { MockComponentProps, MockCommandItemProps } from "./mockTypes";

/**
 * Configure les mocks de base pour les composants UI
 * À utiliser dans les fichiers de test avec : setupUIMocks()
 */
export function setupUIMocks() {
	vi.mock("@/components/ui/card", () => ({
		Card: ({ children, ...p }: MockComponentProps) => <div {...p}>{children}</div>
	}), { virtual: true });

	vi.mock("@/components/ui/button", () => ({
		Button: ({ children, ...p }: MockComponentProps) => <button {...p}>{children}</button>
	}), { virtual: true });

	vi.mock("@/components/ui/input", () => ({
		Input: (props: Record<string, unknown>) => <input {...props} />
	}), { virtual: true });

	vi.mock("@/components/ui/skeleton", () => ({
		Skeleton: (props: Record<string, unknown>) => <div {...props} />
	}), { virtual: true });

	vi.mock("@/components/ui/popover", () => ({
		Popover: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		PopoverTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		PopoverContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	}), { virtual: true });

	vi.mock("@/components/ui/command", () => ({
		Command: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		CommandList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		CommandItem: ({ children, onSelect, ...rest }: MockCommandItemProps) => (
			<div data-testid="cmd-item" onClick={onSelect} {...rest}>{children}</div>
		),
		CommandGroup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		CommandEmpty: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	}), { virtual: true });
}

/**
 * Mocks inline pour utilisation directe dans les fichiers de test
 */
export const uiMocks = {
	card: () => vi.mock("@/components/ui/card", () => ({
		Card: ({ children, ...p }: MockComponentProps) => <div {...p}>{children}</div>
	}), { virtual: true }),

	button: () => vi.mock("@/components/ui/button", () => ({
		Button: ({ children, ...p }: MockComponentProps) => <button {...p}>{children}</button>
	}), { virtual: true }),

	input: () => vi.mock("@/components/ui/input", () => ({
		Input: (props: Record<string, unknown>) => <input {...props} />
	}), { virtual: true }),

	skeleton: () => vi.mock("@/components/ui/skeleton", () => ({
		Skeleton: (props: Record<string, unknown>) => <div {...props} />
	}), { virtual: true }),

	popover: () => vi.mock("@/components/ui/popover", () => ({
		Popover: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		PopoverTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		PopoverContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	}), { virtual: true }),

	command: () => vi.mock("@/components/ui/command", () => ({
		Command: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		CommandList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		CommandItem: ({ children, onSelect, ...rest }: MockCommandItemProps) => (
			<div data-testid="cmd-item" onClick={onSelect} {...rest}>{children}</div>
		),
		CommandGroup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
		CommandEmpty: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	}), { virtual: true }),
};

