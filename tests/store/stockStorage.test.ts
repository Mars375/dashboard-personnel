/**
 * Tests pour stockStorage
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	loadWatchlist,
	saveWatchlist,
	addToWatchlist,
	removeFromWatchlist,
	getCachedStock,
	cacheStock,
	type Stock,
} from "@/store/stockStorage";

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

beforeEach(() => {
	Object.defineProperty(window, "localStorage", {
		value: localStorageMock,
		writable: true,
	});
	localStorageMock.clear();
});

describe("stockStorage", () => {
	describe("loadWatchlist", () => {
		it("retourne un tableau vide si aucune watchlist n'existe", () => {
			expect(loadWatchlist()).toEqual([]);
		});

		it("charge une watchlist existante", () => {
			const watchlist = [
				{
					id: "1",
					name: "Ma Watchlist",
					symbols: ["AAPL", "TSLA"],
					createdAt: Date.now(),
				},
			];
			localStorageMock.setItem("stocks:watchlist", JSON.stringify(watchlist));

			expect(loadWatchlist()).toEqual(watchlist);
		});
	});

	describe("addToWatchlist", () => {
		it("crée une watchlist par défaut si elle n'existe pas", () => {
			addToWatchlist("AAPL");

			const watchlist = loadWatchlist();
			expect(watchlist).toHaveLength(1);
			expect(watchlist[0].symbols).toContain("AAPL");
		});

		it("ajoute un symbole à une watchlist existante", () => {
			const watchlist = [
				{
					id: "1",
					name: "Ma Watchlist",
					symbols: ["AAPL"],
					createdAt: Date.now(),
				},
			];
			localStorageMock.setItem("stocks:watchlist", JSON.stringify(watchlist));

			addToWatchlist("TSLA", "1");

			const updated = loadWatchlist();
			expect(updated[0].symbols).toContain("TSLA");
		});
	});

	describe("removeFromWatchlist", () => {
		it("retire un symbole de la watchlist", () => {
			const watchlist = [
				{
					id: "1",
					name: "Ma Watchlist",
					symbols: ["AAPL", "TSLA"],
					createdAt: Date.now(),
				},
			];
			localStorageMock.setItem("stocks:watchlist", JSON.stringify(watchlist));

			removeFromWatchlist("AAPL", "1");

			const updated = loadWatchlist();
			expect(updated[0].symbols).not.toContain("AAPL");
			expect(updated[0].symbols).toContain("TSLA");
		});
	});

	describe("getCachedStock et cacheStock", () => {
		it("retourne null si le cache n'existe pas", () => {
			expect(getCachedStock("AAPL")).toBeNull();
		});

		it("cache et récupère une action", () => {
			const stock: Stock = {
				symbol: "AAPL",
				name: "Apple Inc.",
				price: 150.0,
				change: 2.5,
				changePercent: 1.69,
				volume: 1000000,
				lastUpdate: new Date().toISOString(),
			};

			cacheStock("AAPL", stock);

			const cached = getCachedStock("AAPL");
			expect(cached).toBeTruthy();
			expect(cached?.symbol).toBe("AAPL");
			expect(cached?.price).toBe(150.0);
		});
	});
});


