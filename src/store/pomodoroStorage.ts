/**
 * Storage pour le widget Pomodoro
 */
import { logger } from "@/lib/logger";

export interface PomodoroSession {
	id: string;
	date: string; // YYYY-MM-DD
	duration: number; // minutes
	completed: boolean;
	createdAt: number;
}

const STORAGE_KEY = "pomodoro:sessions";

export function loadSessions(): PomodoroSession[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement des sessions:", error);
	}
	return [];
}

export function saveSessions(sessions: PomodoroSession[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des sessions:", error);
	}
}

export function addSession(session: Omit<PomodoroSession, "id" | "createdAt">): PomodoroSession {
	const sessions = loadSessions();
	const newSession: PomodoroSession = {
		...session,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
	};
	sessions.push(newSession);
	saveSessions(sessions);
	return newSession;
}


