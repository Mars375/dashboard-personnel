import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadCalendarEvents, saveCalendarEvents } from "@/store/calendarStorage";
import type { CalendarEvent } from "@/widgets/Calendar/types";

describe("calendarStorage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe("loadCalendarEvents", () => {
		it("should return empty array when localStorage is empty", () => {
			const events = loadCalendarEvents();
			expect(events).toEqual([]);
		});

		it("should load valid events from localStorage", () => {
			const mockEvents: CalendarEvent[] = [
				{
					id: "event-1",
					title: "Test Event",
					date: "2025-01-15",
					createdAt: Date.now(),
				},
				{
					id: "event-2",
					title: "Another Event",
					date: "2025-01-16",
					createdAt: Date.now(),
				},
			];

			localStorage.setItem("calendar:events", JSON.stringify(mockEvents));
			const loaded = loadCalendarEvents();

			expect(loaded).toHaveLength(2);
			expect(loaded[0].id).toBe("event-1");
			expect(loaded[1].id).toBe("event-2");
		});

		it("should filter out invalid events", () => {
			const invalidEvents = [
				{
					id: "event-1",
					title: "Valid Event",
					date: "2025-01-15",
					createdAt: Date.now(),
				},
				{
					// Missing required fields
					title: "Invalid Event",
				},
				{
					id: "event-3",
					// Missing title and date
					createdAt: Date.now(),
				},
			];

			localStorage.setItem("calendar:events", JSON.stringify(invalidEvents));
			const loaded = loadCalendarEvents();

			expect(loaded).toHaveLength(1);
			expect(loaded[0].id).toBe("event-1");
		});

		it("should handle Google Calendar events with google- prefix", () => {
			const googleEvents: CalendarEvent[] = [
				{
					id: "google-event-123",
					title: "Google Event",
					date: "2025-01-15",
					createdAt: Date.now(),
				},
			];

			localStorage.setItem("calendar:events", JSON.stringify(googleEvents));
			const loaded = loadCalendarEvents();

			expect(loaded).toHaveLength(1);
			expect(loaded[0].id).toBe("google-event-123");
		});

		it("should return empty array on parse error", () => {
			localStorage.setItem("calendar:events", "invalid json");
			const loaded = loadCalendarEvents();
			expect(loaded).toEqual([]);
		});
	});

	describe("saveCalendarEvents", () => {
		it("should save events to localStorage", () => {
			const events: CalendarEvent[] = [
				{
					id: "event-1",
					title: "Test Event",
					date: "2025-01-15",
					createdAt: Date.now(),
				},
			];

			saveCalendarEvents(events);

			const stored = localStorage.getItem("calendar:events");
			expect(stored).toBeTruthy();
			const parsed = JSON.parse(stored!);
			expect(parsed).toHaveLength(1);
			expect(parsed[0].id).toBe("event-1");
		});

		it("should save empty array", () => {
			saveCalendarEvents([]);
			const stored = localStorage.getItem("calendar:events");
			expect(stored).toBeTruthy();
			const parsed = JSON.parse(stored!);
			expect(parsed).toEqual([]);
		});

		it("should handle save errors gracefully", () => {
			// Mock localStorage.setItem to throw
			const originalSetItem = localStorage.setItem;
			localStorage.setItem = vi.fn(() => {
				throw new Error("Storage quota exceeded");
			});

			const events: CalendarEvent[] = [
				{
					id: "event-1",
					title: "Test",
					date: "2025-01-15",
					createdAt: Date.now(),
				},
			];

			// Should not throw
			expect(() => saveCalendarEvents(events)).not.toThrow();

			// Restore
			localStorage.setItem = originalSetItem;
		});
	});
});

