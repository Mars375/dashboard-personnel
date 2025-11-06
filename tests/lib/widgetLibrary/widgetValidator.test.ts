import { describe, it, expect } from "vitest";
import { validateWidget, validateLibrary, ValidationError } from "@/lib/widgetLibrary/widgetValidator";
import type { ExternalWidgetDefinition, WidgetLibraryMetadata } from "@/lib/widgetLibrary/types";

describe("widgetValidator", () => {
	describe("validateWidget", () => {
		it("should validate a correct widget", () => {
			const widget: ExternalWidgetDefinition = {
				id: "test-widget",
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "https://example.com/widget.js",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
				maxSize: { w: 8, h: 8 },
			};

			const result = validateWidget(widget);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject widget without id", () => {
			const widget = {
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "https://example.com/widget.js",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
			} as Partial<ExternalWidgetDefinition>;

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.MISSING_REQUIRED_FIELD && e.field === "id")).toBe(true);
		});

		it("should reject widget with invalid id format", () => {
			const widget: Partial<ExternalWidgetDefinition> = {
				id: "Invalid ID!",
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "https://example.com/widget.js",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
			};

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.INVALID_ID)).toBe(true);
		});

		it("should reject widget without name", () => {
			const widget = {
				id: "test-widget",
				description: "A test widget",
				moduleUrl: "https://example.com/widget.js",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
			} as Partial<ExternalWidgetDefinition>;

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.MISSING_REQUIRED_FIELD && e.field === "name")).toBe(true);
		});

		it("should reject widget without moduleUrl", () => {
			const widget = {
				id: "test-widget",
				name: "Test Widget",
				description: "A test widget",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
			} as Partial<ExternalWidgetDefinition>;

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.MISSING_REQUIRED_FIELD && e.field === "moduleUrl")).toBe(true);
		});

		it("should reject widget with invalid moduleUrl", () => {
			const widget: Partial<ExternalWidgetDefinition> = {
				id: "test-widget",
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "not-a-valid-url",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
			};

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.INVALID_MODULE_URL)).toBe(true);
		});

		it("should accept relative moduleUrl", () => {
			const widget: ExternalWidgetDefinition = {
				id: "test-widget",
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "./widgets/test.js",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
			};

			const result = validateWidget(widget);
			expect(result.valid).toBe(true);
		});

		it("should reject widget with invalid defaultSize", () => {
			const widget: Partial<ExternalWidgetDefinition> = {
				id: "test-widget",
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "https://example.com/widget.js",
				defaultSize: { w: 0, h: -1 },
				minSize: { w: 2, h: 2 },
			};

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.INVALID_SIZE)).toBe(true);
		});

		it("should reject widget with minSize > defaultSize", () => {
			const widget: Partial<ExternalWidgetDefinition> = {
				id: "test-widget",
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "https://example.com/widget.js",
				defaultSize: { w: 2, h: 2 },
				minSize: { w: 4, h: 4 },
			};

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.INVALID_SIZE)).toBe(true);
		});

		it("should reject widget with maxSize < defaultSize", () => {
			const widget: Partial<ExternalWidgetDefinition> = {
				id: "test-widget",
				name: "Test Widget",
				description: "A test widget",
				moduleUrl: "https://example.com/widget.js",
				defaultSize: { w: 8, h: 8 },
				minSize: { w: 2, h: 2 },
				maxSize: { w: 4, h: 4 },
			};

			const result = validateWidget(widget);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.INVALID_SIZE)).toBe(true);
		});
	});

	describe("validateLibrary", () => {
		it("should validate a correct library", () => {
			const library: WidgetLibraryMetadata = {
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
					{
						id: "widget-2",
						name: "Widget 2",
						description: "Second widget",
						moduleUrl: "https://example.com/widget2.js",
						defaultSize: { w: 3, h: 3 },
						minSize: { w: 2, h: 2 },
					},
				],
			};

			const result = validateLibrary(library);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject library without id", () => {
			const library = {
				name: "Test Library",
				widgets: [],
			} as Partial<WidgetLibraryMetadata>;

			const result = validateLibrary(library);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.MISSING_REQUIRED_FIELD && e.field === "id")).toBe(true);
		});

		it("should reject library without widgets", () => {
			const library: Partial<WidgetLibraryMetadata> = {
				id: "test-library",
				name: "Test Library",
				widgets: undefined as any,
			};

			const result = validateLibrary(library);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.MISSING_REQUIRED_FIELD && e.field === "widgets")).toBe(true);
		});

		it("should reject library with duplicate widget ids", () => {
			const library: WidgetLibraryMetadata = {
				id: "test-library",
				name: "Test Library",
				widgets: [
					{
						id: "duplicate",
						name: "Widget 1",
						description: "First widget",
						moduleUrl: "https://example.com/widget1.js",
						defaultSize: { w: 4, h: 4 },
						minSize: { w: 2, h: 2 },
					},
					{
						id: "duplicate",
						name: "Widget 2",
						description: "Second widget",
						moduleUrl: "https://example.com/widget2.js",
						defaultSize: { w: 3, h: 3 },
						minSize: { w: 2, h: 2 },
					},
				],
			};

			const result = validateLibrary(library);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.error === ValidationError.DUPLICATE_ID)).toBe(true);
		});

		it("should validate invalid widgets in library", () => {
			const library: WidgetLibraryMetadata = {
				id: "test-library",
				name: "Test Library",
				widgets: [
					{
						id: "widget-1",
						name: "Widget 1",
						description: "First widget",
						moduleUrl: "https://example.com/widget1.js",
						defaultSize: { w: 4, h: 4 },
						minSize: { w: 2, h: 2 },
					},
					{
						id: "invalid-widget",
						name: "",
						description: "Invalid widget",
						moduleUrl: "",
						defaultSize: { w: 0, h: 0 },
						minSize: { w: 0, h: 0 },
					},
				],
			};

			const result = validateLibrary(library);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});
});


