// Persistance localStorage pour les bookmarks

import { logger } from "@/lib/logger";

const STORAGE_KEY = "bookmarks:bookmarks";

export interface Bookmark {
	id: string;
	title: string;
	url: string;
	description?: string;
	tags?: string[];
	favicon?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Charge les bookmarks depuis localStorage
 */
export function loadBookmarks(): Bookmark[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return [];
		}
		return JSON.parse(stored) as Bookmark[];
	} catch (error) {
		logger.error("Erreur lors du chargement des bookmarks:", error);
		return [];
	}
}

/**
 * Sauvegarde les bookmarks dans localStorage
 */
export function saveBookmarks(bookmarks: Bookmark[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des bookmarks:", error);
	}
}

/**
 * Ajoute un bookmark
 */
export function addBookmark(bookmark: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Bookmark {
	const bookmarks = loadBookmarks();
	const newBookmark: Bookmark = {
		...bookmark,
		id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	bookmarks.push(newBookmark);
	saveBookmarks(bookmarks);
	return newBookmark;
}

/**
 * Met à jour un bookmark
 */
export function updateBookmark(id: string, updates: Partial<Bookmark>): Bookmark | null {
	const bookmarks = loadBookmarks();
	const index = bookmarks.findIndex((b) => b.id === id);
	if (index === -1) return null;
	
	bookmarks[index] = {
		...bookmarks[index],
		...updates,
		updatedAt: new Date().toISOString(),
	};
	saveBookmarks(bookmarks);
	return bookmarks[index];
}

/**
 * Supprime un bookmark
 */
export function deleteBookmark(id: string): boolean {
	const bookmarks = loadBookmarks();
	const filtered = bookmarks.filter((b) => b.id !== id);
	if (filtered.length === bookmarks.length) return false;
	saveBookmarks(filtered);
	return true;
}

/**
 * Extrait le favicon d'une URL
 */
export function getFaviconUrl(url: string): string {
	try {
		const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
		return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
	} catch {
		return "";
	}
}


