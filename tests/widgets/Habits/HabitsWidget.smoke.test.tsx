/**
 * Tests smoke pour le widget Habits
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { HabitsWidget } from "@/widgets/Habits/HabitsWidget";

// Mock du storage
vi.mock("@/store/habitsStorage", () => ({
	loadHabits: vi.fn(() => []),
	saveHabits: vi.fn(),
	addHabit: vi.fn(),
	updateHabit: vi.fn(),
	deleteHabit: vi.fn(),
	completeHabit: vi.fn(),
	uncompleteHabit: vi.fn(),
}));

describe("HabitsWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rend le widget sans erreur", () => {
		render(<HabitsWidget size="medium" />);

		expect(screen.getByText(/Habitudes/i)).toBeTruthy();
	});

	it("affiche un message quand il n'y a pas d'habitudes", () => {
		render(<HabitsWidget size="medium" />);

		expect(screen.getByText(/Aucune habitude/i)).toBeTruthy();
	});

	it("affiche le bouton d'ajout", () => {
		render(<HabitsWidget size="medium" />);

		const addButton = screen.getByRole("button");
		expect(addButton).toBeTruthy();
	});
});


