import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	loadBookmarks,
	addBookmark,
	updateBookmark,
	deleteBookmark,
	getFaviconUrl,
	type Bookmark,
} from "@/store/bookmarksStorage";

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

describe("bookmarksStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	describe("loadBookmarks", () => {
		it("should return empty array when no bookmarks exist", () => {
			expect(loadBookmarks()).toEqual([]);
		});

		it("should return bookmarks from localStorage", () => {
			const bookmarks: Bookmark[] = [
				{
					id: "bookmark-1",
					title: "Test Bookmark",
					url: "https://example.com",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			];
			localStorageMock.setItem("bookmarks:bookmarks", JSON.stringify(bookmarks));
			expect(loadBookmarks()).toEqual(bookmarks);
		});
	});

	describe("addBookmark", () => {
		it("should add a new bookmark with generated id", () => {
			const bookmark = addBookmark({
				title: "New Bookmark",
				url: "https://example.com",
			});

			expect(bookmark.id).toBeDefined();
			expect(bookmark.title).toBe("New Bookmark");
			expect(bookmark.url).toBe("https://example.com");
			expect(bookmark.createdAt).toBeDefined();
			expect(bookmark.updatedAt).toBeDefined();

			const bookmarks = loadBookmarks();
			expect(bookmarks).toHaveLength(1);
			expect(bookmarks[0].id).toBe(bookmark.id);
		});
	});

	describe("updateBookmark", () => {
		it("should update an existing bookmark", async () => {
			const bookmark = addBookmark({
				title: "Original",
				url: "https://example.com",
			});

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));

			const updated = updateBookmark(bookmark.id, {
				title: "Updated",
				url: "https://updated.com",
			});

			expect(updated).not.toBeNull();
			expect(updated?.title).toBe("Updated");
			expect(updated?.url).toBe("https://updated.com");
			expect(updated?.updatedAt).toBeDefined();
			expect(updated?.updatedAt).not.toBe(bookmark.updatedAt);
		});

		it("should return null for non-existent bookmark", () => {
			expect(updateBookmark("non-existent", { title: "Test" })).toBeNull();
		});
	});

	describe("deleteBookmark", () => {
		it("should delete an existing bookmark", () => {
			const bookmark = addBookmark({
				title: "To Delete",
				url: "https://example.com",
			});

			expect(loadBookmarks()).toHaveLength(1);
			expect(deleteBookmark(bookmark.id)).toBe(true);
			expect(loadBookmarks()).toHaveLength(0);
		});

		it("should return false for non-existent bookmark", () => {
			expect(deleteBookmark("non-existent")).toBe(false);
		});
	});

	describe("getFaviconUrl", () => {
		it("should generate favicon URL for valid URL", () => {
			const url = getFaviconUrl("https://example.com");
			expect(url).toContain("google.com/s2/favicons");
			expect(url).toContain("example.com");
		});

		it("should handle URLs without protocol", () => {
			const url = getFaviconUrl("example.com");
			expect(url).toContain("google.com/s2/favicons");
		});
	});
});


