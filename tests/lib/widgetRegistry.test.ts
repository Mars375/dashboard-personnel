import { describe, it, expect } from "vitest";
import { widgetRegistry, getWidgetDefinition, getAllWidgetDefinitions } from "@/lib/widgetRegistry";

describe("widgetRegistry", () => {
	it("should have widgets in registry", () => {
		expect(widgetRegistry.length).toBeGreaterThan(0);
	});

	it("should have all required fields for each widget", () => {
		widgetRegistry.forEach((widget) => {
			expect(widget.id).toBeDefined();
			expect(widget.name).toBeDefined();
			expect(widget.description).toBeDefined();
			expect(widget.icon).toBeDefined();
			expect(widget.component).toBeDefined();
			expect(widget.defaultSize).toBeDefined();
			expect(widget.defaultSize.w).toBeGreaterThan(0);
			expect(widget.defaultSize.h).toBeGreaterThan(0);
			expect(widget.minSize).toBeDefined();
			expect(widget.minSize.w).toBeGreaterThan(0);
			expect(widget.minSize.h).toBeGreaterThan(0);
		});
	});

	it("should have unique widget ids", () => {
		const ids = widgetRegistry.map((w) => w.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	it("should get widget definition by type", () => {
		const weather = getWidgetDefinition("weather");
		expect(weather).toBeDefined();
		expect(weather?.id).toBe("weather");

		const todo = getWidgetDefinition("todo");
		expect(todo).toBeDefined();
		expect(todo?.id).toBe("todo");
	});

	it("should return undefined for non-existent widget", () => {
		const widget = getWidgetDefinition("non-existent");
		expect(widget).toBeUndefined();
	});

	it("should have valid size constraints", () => {
		widgetRegistry.forEach((widget) => {
			// minSize should be <= defaultSize
			expect(widget.minSize.w).toBeLessThanOrEqual(widget.defaultSize.w);
			expect(widget.minSize.h).toBeLessThanOrEqual(widget.defaultSize.h);

			// If maxSize exists, it should be >= defaultSize
			if (widget.maxSize) {
				expect(widget.maxSize.w).toBeGreaterThanOrEqual(widget.defaultSize.w);
				expect(widget.maxSize.h).toBeGreaterThanOrEqual(widget.defaultSize.h);
			}
		});
	});

	it("should have all common widget types", () => {
		const types = widgetRegistry.map((w) => w.id);
		expect(types).toContain("weather");
		expect(types).toContain("todo");
		expect(types).toContain("calendar");
		expect(types).toContain("bookmarks");
		expect(types).toContain("habits");
		expect(types).toContain("journal");
		expect(types).toContain("finance");
		expect(types).toContain("pomodoro");
		expect(types).toContain("stats");
		expect(types).toContain("rss");
		expect(types).toContain("quote");
		expect(types).toContain("stock");
	});

	it("should get all widget definitions including externals", async () => {
		const all = await getAllWidgetDefinitions();
		expect(all.length).toBeGreaterThanOrEqual(widgetRegistry.length);
		expect(all.some((w) => w.id === "weather")).toBe(true);
	});
});


