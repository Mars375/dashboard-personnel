import { describe, it, expect, beforeEach } from "vitest";
import {
	loadJournalEntries,
	addJournalEntry,
	updateJournalEntry,
	deleteJournalEntry,
	getJournalEntryByDate,
	type JournalEntry,
} from "@/store/journalStorage";

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

describe("journalStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	it("should load empty array when no entries exist", () => {
		expect(loadJournalEntries()).toEqual([]);
	});

	it("should add an entry", () => {
		const entry = addJournalEntry({
			date: new Date().toISOString().split("T")[0],
			title: "My Day",
			content: "Today was great!",
		});

		expect(entry.id).toBeDefined();
		expect(entry.title).toBe("My Day");
		expect(entry.content).toBe("Today was great!");
		expect(loadJournalEntries()).toHaveLength(1);
	});

	it("should update an entry", () => {
		const entry = addJournalEntry({
			date: new Date().toISOString().split("T")[0],
			title: "My Day",
			content: "Today was great!",
		});

		const updated = updateJournalEntry(entry.id, { title: "Updated Day" });
		expect(updated).not.toBeNull();
		expect(updated?.title).toBe("Updated Day");
	});

	it("should delete an entry", () => {
		const entry = addJournalEntry({
			date: new Date().toISOString().split("T")[0],
			title: "My Day",
			content: "Today was great!",
		});

		expect(deleteJournalEntry(entry.id)).toBe(true);
		expect(loadJournalEntries()).toHaveLength(0);
	});

	it("should get entry by date", () => {
		const date = new Date().toISOString().split("T")[0];
		const entry = addJournalEntry({
			date,
			title: "My Day",
			content: "Today was great!",
		});

		const found = getJournalEntryByDate(date);
		expect(found).not.toBeNull();
		expect(found?.id).toBe(entry.id);
	});

	it("should return null for non-existent date", () => {
		const found = getJournalEntryByDate("2024-01-01");
		expect(found).toBeNull();
	});
});

