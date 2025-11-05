// Persistance localStorage pour les notes

import { logger } from "@/lib/logger";

const STORAGE_KEY = "notes:notes";

export interface Note {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
	tags?: string[];
	color?: string;
}

/**
 * Charge les notes depuis localStorage
 */
export function loadNotes(): Note[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return [];
		}
		return JSON.parse(stored) as Note[];
	} catch (error) {
		logger.error("Erreur lors du chargement des notes:", error);
		return [];
	}
}

/**
 * Sauvegarde les notes dans localStorage
 */
export function saveNotes(notes: Note[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des notes:", error);
	}
}

/**
 * Ajoute une note
 */
export function addNote(note: Omit<Note, "id" | "createdAt" | "updatedAt">): Note {
	const notes = loadNotes();
	const newNote: Note = {
		...note,
		id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	notes.push(newNote);
	saveNotes(notes);
	return newNote;
}

/**
 * Met à jour une note
 */
export function updateNote(id: string, updates: Partial<Note>): Note | null {
	const notes = loadNotes();
	const index = notes.findIndex((n) => n.id === id);
	if (index === -1) return null;
	
	notes[index] = {
		...notes[index],
		...updates,
		updatedAt: new Date().toISOString(),
	};
	saveNotes(notes);
	return notes[index];
}

/**
 * Supprime une note
 */
export function deleteNote(id: string): boolean {
	const notes = loadNotes();
	const filtered = notes.filter((n) => n.id !== id);
	if (filtered.length === notes.length) return false;
	saveNotes(filtered);
	return true;
}

