/**
 * Storage pour le widget RSS
 */
import { logger } from "@/lib/logger";

export interface RSSFeed {
	id: string;
	name: string;
	url: string;
	category?: string;
	createdAt: number;
}

export interface RSSItem {
	id: string;
	feedId: string;
	title: string;
	link: string;
	description?: string;
	pubDate: string;
	read: boolean;
	createdAt: number;
}

const STORAGE_KEY_FEEDS = "rss:feeds";
const STORAGE_KEY_ITEMS = "rss:items";

export function loadFeeds(): RSSFeed[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY_FEEDS);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement des flux:", error);
	}
	return [];
}

export function saveFeeds(feeds: RSSFeed[]): void {
	try {
		localStorage.setItem(STORAGE_KEY_FEEDS, JSON.stringify(feeds));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des flux:", error);
	}
}

export function addFeed(feed: Omit<RSSFeed, "id" | "createdAt">): RSSFeed {
	const feeds = loadFeeds();
	const newFeed: RSSFeed = {
		...feed,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
	};
	feeds.push(newFeed);
	saveFeeds(feeds);
	return newFeed;
}

export function updateFeed(id: string, updates: Partial<Omit<RSSFeed, "id" | "createdAt">>): RSSFeed | null {
	const feeds = loadFeeds();
	const index = feeds.findIndex((f) => f.id === id);
	if (index === -1) return null;
	feeds[index] = { ...feeds[index], ...updates };
	saveFeeds(feeds);
	return feeds[index];
}

export function deleteFeed(id: string): void {
	const feeds = loadFeeds();
	const filtered = feeds.filter((f) => f.id !== id);
	saveFeeds(filtered);
	// Supprimer aussi les items associés
	const items = loadItems();
	const filteredItems = items.filter((i) => i.feedId !== id);
	saveItems(filteredItems);
}

export function loadItems(): RSSItem[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement des articles:", error);
	}
	return [];
}

export function saveItems(items: RSSItem[]): void {
	try {
		localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des articles:", error);
	}
}

export function addItem(item: Omit<RSSItem, "id" | "createdAt">): RSSItem {
	const items = loadItems();
	const newItem: RSSItem = {
		...item,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
	};
	items.push(newItem);
	saveItems(items);
	return newItem;
}

export function markItemAsRead(id: string): void {
	const items = loadItems();
	const index = items.findIndex((i) => i.id === id);
	if (index !== -1) {
		items[index].read = true;
		saveItems(items);
	}
}


