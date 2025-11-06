/**
import { logger } from "@/lib/logger";
 * Storage pour le widget Quote
 */

export interface Quote {
	id: string;
	text: string;
	author?: string;
	category?: string;
	favorite: boolean;
	createdAt: number;
}

const STORAGE_KEY = "quote:quotes";

export function loadQuotes(): Quote[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement des citations:", error);
	}
	return [];
}

export function saveQuotes(quotes: Quote[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des citations:", error);
	}
}

export function addQuote(quote: Omit<Quote, "id" | "createdAt" | "favorite">): Quote {
	const quotes = loadQuotes();
	const newQuote: Quote = {
		...quote,
		id: crypto.randomUUID(),
		favorite: false,
		createdAt: Date.now(),
	};
	quotes.push(newQuote);
	saveQuotes(quotes);
	return newQuote;
}

export function toggleFavorite(id: string): void {
	const quotes = loadQuotes();
	const index = quotes.findIndex((q) => q.id === id);
	if (index !== -1) {
		quotes[index].favorite = !quotes[index].favorite;
		saveQuotes(quotes);
	}
}

export function getRandomQuote(): Quote | null {
	const quotes = loadQuotes();
	if (quotes.length === 0) return null;
	return quotes[Math.floor(Math.random() * quotes.length)];
}

