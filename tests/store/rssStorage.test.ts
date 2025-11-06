import { describe, it, expect, beforeEach } from "vitest";
import {
	loadFeeds,
	addFeed,
	updateFeed,
	deleteFeed,
	loadItems,
	addItem,
	markItemAsRead,
	type RSSFeed,
} from "@/store/rssStorage";

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

describe("rssStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	it("should load empty array when no feeds exist", () => {
		expect(loadFeeds()).toEqual([]);
	});

	it("should add a feed", () => {
		const feed = addFeed({
			name: "Test Feed",
			url: "https://example.com/feed.xml",
		});

		expect(feed.id).toBeDefined();
		expect(feed.name).toBe("Test Feed");
		expect(feed.url).toBe("https://example.com/feed.xml");
		expect(loadFeeds()).toHaveLength(1);
	});

	it("should update a feed", () => {
		const feed = addFeed({
			name: "Test Feed",
			url: "https://example.com/feed.xml",
		});

		const updated = updateFeed(feed.id, { name: "Updated Feed" });
		expect(updated).not.toBeNull();
		expect(updated?.name).toBe("Updated Feed");
	});

	it("should delete a feed", () => {
		const feed = addFeed({
			name: "Test Feed",
			url: "https://example.com/feed.xml",
		});

		deleteFeed(feed.id);
		expect(loadFeeds()).toHaveLength(0);
	});

	it("should mark article as read", () => {
		const feed = addFeed({
			name: "Test Feed",
			url: "https://example.com/feed.xml",
		});

		const item = addItem({
			feedId: feed.id,
			title: "Test Article",
			link: "https://example.com/article",
			pubDate: new Date().toISOString(),
			read: false,
		});

		markItemAsRead(item.id);
		const updated = loadItems().find((i) => i.id === item.id);
		expect(updated?.read).toBe(true);
	});
});

