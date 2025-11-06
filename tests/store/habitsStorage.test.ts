import { describe, it, expect, beforeEach } from "vitest";
import {
	loadHabits,
	addHabit,
	updateHabit,
	deleteHabit,
	completeHabit,
	uncompleteHabit,
	type Habit,
} from "@/store/habitsStorage";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("habitsStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	it("should load empty array when no habits exist", () => {
		expect(loadHabits()).toEqual([]);
	});

	it("should add a habit", () => {
		const habit = addHabit({
			name: "Exercise",
			color: "blue",
		});

		expect(habit.id).toBeDefined();
		expect(habit.name).toBe("Exercise");
		expect(habit.color).toBe("blue");
		expect(habit.completedDates).toEqual([]);
		expect(loadHabits()).toHaveLength(1);
	});

	it("should update a habit", () => {
		const habit = addHabit({
			name: "Exercise",
			color: "blue",
		});

		const updated = updateHabit(habit.id, { name: "Daily Exercise" });
		expect(updated).not.toBeNull();
		expect(updated?.name).toBe("Daily Exercise");
	});

	it("should delete a habit", () => {
		const habit = addHabit({
			name: "Exercise",
			color: "blue",
		});

		expect(deleteHabit(habit.id)).toBe(true);
		expect(loadHabits()).toHaveLength(0);
	});

	it("should mark habit as completed for a date", () => {
		const habit = addHabit({
			name: "Exercise",
			color: "blue",
		});

		completeHabit(habit.id);
		const today = new Date().toISOString().split("T")[0];

		const updated = loadHabits().find((h) => h.id === habit.id);
		expect(updated?.completedDates).toContain(today);
	});

	it("should unmark habit if already completed", () => {
		const habit = addHabit({
			name: "Exercise",
			color: "blue",
		});

		completeHabit(habit.id);
		uncompleteHabit(habit.id);
		const today = new Date().toISOString().split("T")[0];

		const updated = loadHabits().find((h) => h.id === habit.id);
		expect(updated?.completedDates).not.toContain(today);
	});
});

