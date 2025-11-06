import { describe, it, expect, beforeEach } from "vitest";
import {
	loadSessions,
	addSession,
	type PomodoroSession,
} from "@/store/pomodoroStorage";

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

describe("pomodoroStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	it("should load empty array when no sessions exist", () => {
		expect(loadSessions()).toEqual([]);
	});

	it("should add a session", () => {
		const session = addSession({
			mode: "work",
			duration: 25,
			completedAt: new Date().toISOString(),
		});

		expect(session.id).toBeDefined();
		expect(session.mode).toBe("work");
		expect(session.duration).toBe(25);
		expect(loadSessions()).toHaveLength(1);
	});

	it("should filter today's sessions", () => {
		const today = new Date().toISOString().split("T")[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

		addSession({
			date: today,
			duration: 25,
			completed: true,
		});

		addSession({
			date: yesterday,
			duration: 25,
			completed: true,
		});

		const allSessions = loadSessions();
		const todaySessions = allSessions.filter((s) => s.date === today);
		expect(todaySessions.length).toBeGreaterThanOrEqual(1);
		expect(todaySessions.every((s) => s.date === today)).toBe(true);
	});
});

