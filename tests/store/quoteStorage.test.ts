import { describe, it, expect, beforeEach } from "vitest";
import {
	loadQuotes,
	addQuote,
	toggleFavorite,
	getRandomQuote,
	type Quote,
} from "@/store/quoteStorage";

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

describe("quoteStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	it("should load empty array when no favorites exist", () => {
		expect(loadQuotes()).toEqual([]);
	});

	it("should add a favorite", () => {
		const quote = addQuote({
			text: "Test quote",
			author: "Test Author",
		});

		toggleFavorite(quote.id);
		const quotes = loadQuotes();
		expect(quotes).toHaveLength(1);
		expect(quotes[0].text).toBe("Test quote");
		expect(quotes[0].favorite).toBe(true);
	});

	it("should remove a favorite", () => {
		const quote = addQuote({
			text: "Test quote",
			author: "Test Author",
		});

		toggleFavorite(quote.id);
		toggleFavorite(quote.id);
		const quotes = loadQuotes();
		expect(quotes[0].favorite).toBe(false);
	});

	it("should check if quote is favorite", () => {
		const quote = addQuote({
			text: "Test quote",
			author: "Test Author",
		});

		expect(quote.favorite).toBe(false);
		toggleFavorite(quote.id);
		const updated = loadQuotes().find((q) => q.id === quote.id);
		expect(updated?.favorite).toBe(true);
		toggleFavorite(quote.id);
		const updated2 = loadQuotes().find((q) => q.id === quote.id);
		expect(updated2?.favorite).toBe(false);
	});

	it("should not add duplicate favorites", () => {
		const quote = addQuote({
			text: "Test quote",
			author: "Test Author",
		});

		toggleFavorite(quote.id);
		toggleFavorite(quote.id);
		toggleFavorite(quote.id);
		const quotes = loadQuotes();
		expect(quotes).toHaveLength(1);
		expect(quotes[0].favorite).toBe(true);
	});
});

