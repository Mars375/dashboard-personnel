import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	loadCustomWidgets,
	saveCustomWidgets,
	addCustomWidget,
	updateCustomWidget,
	removeCustomWidget,
	getCustomWidget,
	loadWidgetLibraries,
	saveWidgetLibraries,
	addWidgetLibrary,
	updateWidgetLibrary,
	removeWidgetLibrary,
	getWidgetLibrary,
} from "@/lib/widgetLibrary/widgetStorage";
import type { ExternalWidgetDefinition, WidgetLibraryMetadata } from "@/lib/widgetLibrary/types";

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

describe("widgetStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	describe("Custom Widgets", () => {
		const testWidget: ExternalWidgetDefinition = {
			id: "test-widget",
			name: "Test Widget",
			description: "A test widget",
			moduleUrl: "https://example.com/widget.js",
			defaultSize: { w: 4, h: 4 },
			minSize: { w: 2, h: 2 },
		};

		it("should load empty array when no widgets stored", () => {
			const widgets = loadCustomWidgets();
			expect(widgets).toEqual([]);
		});

		it("should save and load widgets", () => {
			saveCustomWidgets([testWidget]);
			const widgets = loadCustomWidgets();
			expect(widgets).toHaveLength(1);
			expect(widgets[0]).toMatchObject(testWidget);
		});

		it("should add a custom widget", () => {
			addCustomWidget(testWidget);
			const widgets = loadCustomWidgets();
			expect(widgets).toHaveLength(1);
			expect(widgets[0].id).toBe("test-widget");
			expect(widgets[0].addedAt).toBeDefined();
			expect(widgets[0].updatedAt).toBeDefined();
		});

		it("should throw error when adding duplicate widget", () => {
			addCustomWidget(testWidget);
			expect(() => addCustomWidget(testWidget)).toThrow();
		});

		it("should update a custom widget", () => {
			addCustomWidget(testWidget);
			const originalUpdatedAt = getCustomWidget("test-widget")?.updatedAt;
			
			// Wait a bit to ensure different timestamp
			vi.useFakeTimers();
			vi.advanceTimersByTime(1000);
			
			updateCustomWidget("test-widget", { name: "Updated Widget" });
			const updated = getCustomWidget("test-widget");
			expect(updated?.name).toBe("Updated Widget");
			expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
			
			vi.useRealTimers();
		});

		it("should throw error when updating non-existent widget", () => {
			expect(() => updateCustomWidget("non-existent", { name: "Test" })).toThrow();
		});

		it("should remove a custom widget", () => {
			addCustomWidget(testWidget);
			removeCustomWidget("test-widget");
			const widgets = loadCustomWidgets();
			expect(widgets).toHaveLength(0);
		});

		it("should throw error when removing non-existent widget", () => {
			expect(() => removeCustomWidget("non-existent")).toThrow();
		});

		it("should get a custom widget by id", () => {
			addCustomWidget(testWidget);
			const widget = getCustomWidget("test-widget");
			expect(widget).toMatchObject(testWidget);
		});

		it("should return undefined for non-existent widget", () => {
			const widget = getCustomWidget("non-existent");
			expect(widget).toBeUndefined();
		});
	});

	describe("Widget Libraries", () => {
		const testLibrary: WidgetLibraryMetadata = {
			id: "test-library",
			name: "Test Library",
			description: "A test library",
			widgets: [
				{
					id: "widget-1",
					name: "Widget 1",
					description: "First widget",
					moduleUrl: "https://example.com/widget1.js",
					defaultSize: { w: 4, h: 4 },
					minSize: { w: 2, h: 2 },
				},
			],
		};

		it("should load empty array when no libraries stored", () => {
			const libraries = loadWidgetLibraries();
			expect(libraries).toEqual([]);
		});

		it("should save and load libraries", () => {
			saveWidgetLibraries([testLibrary]);
			const libraries = loadWidgetLibraries();
			expect(libraries).toHaveLength(1);
			expect(libraries[0]).toMatchObject(testLibrary);
		});

		it("should add a widget library", () => {
			addWidgetLibrary(testLibrary);
			const libraries = loadWidgetLibraries();
			expect(libraries).toHaveLength(1);
			expect(libraries[0].id).toBe("test-library");
			expect(libraries[0].createdAt).toBeDefined();
			expect(libraries[0].updatedAt).toBeDefined();
		});

		it("should throw error when adding duplicate library", () => {
			addWidgetLibrary(testLibrary);
			expect(() => addWidgetLibrary(testLibrary)).toThrow();
		});

	it("should update a widget library", async () => {
		addWidgetLibrary(testLibrary);
		const originalUpdatedAt = getWidgetLibrary("test-library")?.updatedAt;
		
		// Wait a bit to ensure different timestamp
		await new Promise((resolve) => setTimeout(resolve, 10));
		
		updateWidgetLibrary("test-library", { name: "Updated Library" });
		const updated = getWidgetLibrary("test-library");
		expect(updated?.name).toBe("Updated Library");
		expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
	});

		it("should throw error when updating non-existent library", () => {
			expect(() => updateWidgetLibrary("non-existent", { name: "Test" })).toThrow();
		});

		it("should remove a widget library", () => {
			addWidgetLibrary(testLibrary);
			removeWidgetLibrary("test-library");
			const libraries = loadWidgetLibraries();
			expect(libraries).toHaveLength(0);
		});

		it("should throw error when removing non-existent library", () => {
			expect(() => removeWidgetLibrary("non-existent")).toThrow();
		});

		it("should get a widget library by id", () => {
			addWidgetLibrary(testLibrary);
			const library = getWidgetLibrary("test-library");
			expect(library).toMatchObject(testLibrary);
		});

		it("should return undefined for non-existent library", () => {
			const library = getWidgetLibrary("non-existent");
			expect(library).toBeUndefined();
		});
	});
});

