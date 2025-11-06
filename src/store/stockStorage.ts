/**
 * Storage pour le widget Bourse
 */

import { logger } from "@/lib/logger";

export interface Stock {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
	volume: number;
	marketCap?: number;
	lastUpdate: string;
}

export interface StockWatchlist {
	id: string;
	name: string;
	symbols: string[];
	createdAt: number;
}

const STORAGE_KEY = "stocks:watchlist";
const STOCKS_CACHE_KEY = "stocks:cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function loadWatchlist(): StockWatchlist[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement de la watchlist:", error);
	}
	return [];
}

export function saveWatchlist(watchlist: StockWatchlist[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde de la watchlist:", error);
	}
}

export function addToWatchlist(symbol: string, watchlistId?: string): void {
	const watchlist = loadWatchlist();
	if (watchlistId) {
		const list = watchlist.find((w) => w.id === watchlistId);
		if (list && !list.symbols.includes(symbol)) {
			list.symbols.push(symbol);
		}
	} else {
		// Créer une watchlist par défaut si elle n'existe pas
		if (watchlist.length === 0) {
			watchlist.push({
				id: crypto.randomUUID(),
				name: "Ma Watchlist",
				symbols: [symbol],
				createdAt: Date.now(),
			});
		} else {
			watchlist[0].symbols.push(symbol);
		}
	}
	saveWatchlist(watchlist);
}

export function removeFromWatchlist(symbol: string, watchlistId: string): void {
	const watchlist = loadWatchlist();
	const list = watchlist.find((w) => w.id === watchlistId);
	if (list) {
		list.symbols = list.symbols.filter((s) => s !== symbol);
		saveWatchlist(watchlist);
	}
}

export function getCachedStock(symbol: string): Stock | null {
	try {
		const cached = localStorage.getItem(`${STOCKS_CACHE_KEY}:${symbol}`);
		if (cached) {
			const data = JSON.parse(cached);
			if (Date.now() - data.timestamp < CACHE_DURATION) {
				return data.stock;
			}
		}
	} catch (error) {
		logger.error("Erreur lors de la récupération du cache:", error);
	}
	return null;
}

export function cacheStock(symbol: string, stock: Stock): void {
	try {
		localStorage.setItem(`${STOCKS_CACHE_KEY}:${symbol}`, JSON.stringify({
			stock,
			timestamp: Date.now(),
		}));
	} catch (error) {
		logger.error("Erreur lors de la mise en cache:", error);
	}
}


