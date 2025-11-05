// Persistance localStorage pour le journal

import { logger } from "@/lib/logger";

const STORAGE_KEY = "journal:entries";

export interface JournalEntry {
	id: string;
	date: string; // YYYY-MM-DD
	title: string;
	content: string;
	mood?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

/**
 * Charge les entrées du journal depuis localStorage
 */
export function loadJournalEntries(): JournalEntry[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return [];
		}
		return JSON.parse(stored) as JournalEntry[];
	} catch (error) {
		logger.error("Erreur lors du chargement du journal:", error);
		return [];
	}
}

/**
 * Sauvegarde les entrées du journal dans localStorage
 */
export function saveJournalEntries(entries: JournalEntry[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde du journal:", error);
	}
}

/**
 * Ajoute une entrée au journal
 */
export function addJournalEntry(entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">): JournalEntry {
	const entries = loadJournalEntries();
	const newEntry: JournalEntry = {
		...entry,
		id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	entries.push(newEntry);
	saveJournalEntries(entries);
	return newEntry;
}

/**
 * Met à jour une entrée du journal
 */
export function updateJournalEntry(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
	const entries = loadJournalEntries();
	const index = entries.findIndex((e) => e.id === id);
	if (index === -1) return null;
	
	entries[index] = {
		...entries[index],
		...updates,
		updatedAt: new Date().toISOString(),
	};
	saveJournalEntries(entries);
	return entries[index];
}

/**
 * Supprime une entrée du journal
 */
export function deleteJournalEntry(id: string): boolean {
	const entries = loadJournalEntries();
	const filtered = entries.filter((e) => e.id !== id);
	if (filtered.length === entries.length) return false;
	saveJournalEntries(filtered);
	return true;
}

/**
 * Récupère une entrée par date
 */
export function getJournalEntryByDate(date: string): JournalEntry | null {
	const entries = loadJournalEntries();
	return entries.find((e) => e.date === date) || null;
}

