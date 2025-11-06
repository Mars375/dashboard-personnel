/**
 * Tests smoke pour le widget Journal
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { JournalWidget } from "@/widgets/Journal/JournalWidget";

// Mock du storage
vi.mock("@/store/journalStorage", () => ({
	loadJournalEntries: vi.fn(() => []),
	saveJournalEntries: vi.fn(),
	addJournalEntry: vi.fn(),
	updateJournalEntry: vi.fn(),
	deleteJournalEntry: vi.fn(),
	getJournalEntryByDate: vi.fn(() => null),
}));

describe("JournalWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rend le widget sans erreur", () => {
		render(<JournalWidget size="medium" />);

		// Le widget devrait se rendre sans erreur
		expect(document.body).toBeTruthy();
	});

	it("affiche un message quand il n'y a pas d'entrées", () => {
		render(<JournalWidget size="medium" />);

		expect(screen.getByText(/Aucune entrée/i)).toBeInTheDocument();
	});
});


