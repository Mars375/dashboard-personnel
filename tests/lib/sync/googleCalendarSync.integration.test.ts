import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GoogleCalendarSyncProvider } from "@/lib/sync/googleCalendarSync";
import type { CalendarSyncProviderConfig } from "@/lib/sync/calendarSync";
import type { CalendarEvent } from "@/widgets/Calendar/types";

// Mock OAuth Manager
vi.mock("@/lib/auth/oauthManager", () => ({
	getOAuthManager: () => ({
		isConnected: vi.fn().mockReturnValue(true),
		getValidAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
	}),
}));

// Mock fetch
global.fetch = vi.fn();

describe("GoogleCalendarSyncProvider - Integration Tests", () => {
	const validConfig: CalendarSyncProviderConfig = {
		provider: "google-calendar",
		enabled: true,
		calendarId: "primary",
		credentials: {
			token: "oauth",
		},
	};

	let provider: GoogleCalendarSyncProvider;

	beforeEach(() => {
		vi.clearAllMocks();
		provider = new GoogleCalendarSyncProvider({ calendarId: validConfig.calendarId });
		// Enable the provider manually since constructor doesn't accept enabled
		provider.enabled = true;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("pullEvents", () => {
		it("should pull events and convert them correctly", async () => {
			const mockCalendarsResponse = {
				items: [
					{ id: "primary", summary: "Primary Calendar" },
				],
				nextPageToken: undefined,
			};

			const mockEventsResponse = {
				items: [
					{
						id: "event-1",
						summary: "Event 1",
						start: { date: "2024-12-31" },
						end: { date: "2024-12-31" },
						created: "2024-01-01T00:00:00Z",
						updated: "2024-01-01T00:00:00Z",
					},
					{
						id: "event-2",
						summary: "Event 2",
						start: { dateTime: "2024-12-31T10:00:00Z" },
						end: { dateTime: "2024-12-31T11:00:00Z" },
						created: "2024-01-01T00:00:00Z",
						updated: "2024-01-01T00:00:00Z",
					},
				],
				nextPageToken: undefined,
			};

			// Mock: getAllCalendars -> fetch calendarList, then pullEvents -> fetch events
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCalendarsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockEventsResponse,
				});

			const events = await provider.pullEvents();

			expect(events.length).toBe(2);
			expect(events[0].id).toBe("google-event-1");
			expect(events[0].title).toBe("Event 1");
			expect(events[0].date).toBe("2024-12-31");
			expect(events[1].time).toBeDefined();
		});

		it("should handle pagination", async () => {
			const mockCalendarsResponse = {
				items: [
					{ id: "primary", summary: "Primary Calendar" },
				],
				nextPageToken: undefined,
			};

			const mockEventsResponse1 = {
				items: [
					{
						id: "event-1",
						summary: "Event 1",
						start: { date: "2024-12-31" },
						end: { date: "2024-12-31" },
						created: "2024-01-01T00:00:00Z",
						updated: "2024-01-01T00:00:00Z",
					},
				],
				nextPageToken: "page-2",
			};

			const mockEventsResponse2 = {
				items: [
					{
						id: "event-2",
						summary: "Event 2",
						start: { date: "2024-12-30" },
						end: { date: "2024-12-30" },
						created: "2024-01-01T00:00:00Z",
						updated: "2024-01-01T00:00:00Z",
					},
				],
				nextPageToken: undefined,
			};

			// Mock: getAllCalendars -> fetch calendarList, then pullEvents with pagination
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCalendarsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockEventsResponse1,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockEventsResponse2,
				});

			const events = await provider.pullEvents();

			expect(events.length).toBe(2);
		});

		it("should handle multiple calendars", async () => {
			const mockCalendarsResponse = {
				items: [
					{ id: "primary", summary: "Primary" },
					{ id: "calendar-2", summary: "Calendar 2" },
				],
				nextPageToken: undefined,
			};

			const mockEventsResponse1 = {
				items: [
					{
						id: "event-1",
						summary: "Event 1",
						start: { date: "2024-12-31" },
						end: { date: "2024-12-31" },
						created: "2024-01-01T00:00:00Z",
						updated: "2024-01-01T00:00:00Z",
					},
				],
				nextPageToken: undefined,
			};

			const mockEventsResponse2 = {
				items: [
					{
						id: "event-2",
						summary: "Event 2",
						start: { date: "2024-12-30" },
						end: { date: "2024-12-30" },
						created: "2024-01-01T00:00:00Z",
						updated: "2024-01-01T00:00:00Z",
					},
				],
				nextPageToken: undefined,
			};

			// Mock: getAllCalendars -> fetch calendarList, then pullEvents for each calendar
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCalendarsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockEventsResponse1,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockEventsResponse2,
				});

			const events = await provider.pullEvents();

			expect(events.length).toBe(2);
		});
	});

	describe("pushEvents", () => {
		it("should create new event", async () => {
			const event: CalendarEvent = {
				id: "local-event-1",
				title: "New Event",
				date: "2024-12-31",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			const mockCalendarsResponse = {
				items: [
					{ id: "primary", summary: "Primary Calendar" },
				],
				nextPageToken: undefined,
			};

			const mockCreatedEvent = {
				id: "google-event-123",
				summary: "New Event",
				start: { date: "2024-12-31" },
				end: { date: "2024-12-31" },
			};

			// Mock: getCalendarId -> getAllCalendars -> fetch calendarList, then pushEvents -> POST event
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCalendarsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCreatedEvent,
				});

			await provider.pushEvents([event]);

			// Verify POST was called
			const postCalls = (global.fetch as any).mock.calls.filter(
				(call: any[]) => call[1]?.method === "POST"
			);
			expect(postCalls.length).toBeGreaterThan(0);
		});

		it("should update existing event with Google ID", async () => {
			const event: CalendarEvent = {
				id: "google-event-123",
				title: "Updated Event",
				date: "2024-12-31",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			const mockCalendarsResponse = {
				items: [
					{ id: "primary", summary: "Primary Calendar" },
				],
				nextPageToken: undefined,
			};

			// Mock: getCalendarId -> getAllCalendars -> fetch calendarList, then pushEvents -> PUT event
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCalendarsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: "event-123", summary: "Updated Event" }),
				});

			await provider.pushEvents([event]);

			// Verify PUT was called
			const putCalls = (global.fetch as any).mock.calls.filter(
				(call: any[]) => call[1]?.method === "PUT"
			);
			expect(putCalls.length).toBeGreaterThan(0);
		});
	});

	describe("deleteEvent", () => {
		it("should delete event with Google ID", async () => {
			const mockCalendarsResponse = {
				items: [
					{ id: "primary", summary: "Primary Calendar" },
				],
				nextPageToken: undefined,
			};

			// Mock: getCalendarId -> getAllCalendars (may call multiple times), then deleteEvent -> DELETE event
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCalendarsResponse,
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCalendarsResponse, // getCalendarId may call getAllCalendars again
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
				});

			await provider.deleteEvent("google-event-123");

			// Verify DELETE was called
			const deleteCalls = (global.fetch as any).mock.calls.filter(
				(call: any[]) => call[1]?.method === "DELETE"
			);
			expect(deleteCalls.length).toBeGreaterThan(0);
		});
	});
});

