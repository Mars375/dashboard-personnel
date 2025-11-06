import { describe, it, expect } from "vitest";
import { calculateWidgetSize, type WidgetSize } from "@/lib/widgetSize";

describe("widgetSize", () => {
	describe("calculateWidgetSize", () => {
		it("should return compact for small widgets", () => {
			expect(calculateWidgetSize({ w: 2, h: 3 }, "weather")).toBe("compact");
			expect(calculateWidgetSize({ w: 3, h: 3 }, "weather")).toBe("compact");
			expect(calculateWidgetSize({ w: 2, h: 2 }, "weather")).toBe("compact");
		});

		it("should return medium for medium widgets", () => {
			expect(calculateWidgetSize({ w: 4, h: 4 }, "weather")).toBe("medium");
			expect(calculateWidgetSize({ w: 4, h: 6 }, "weather")).toBe("medium");
			expect(calculateWidgetSize({ w: 5, h: 5 }, "weather")).toBe("medium");
			expect(calculateWidgetSize({ w: 5, h: 6 }, "weather")).toBe("medium");
		});

		it("should return full for large widgets", () => {
			expect(calculateWidgetSize({ w: 6, h: 6 }, "weather")).toBe("full");
			expect(calculateWidgetSize({ w: 8, h: 4 }, "weather")).toBe("full");
			expect(calculateWidgetSize({ w: 4, h: 8 }, "weather")).toBe("full");
			expect(calculateWidgetSize({ w: 10, h: 10 }, "weather")).toBe("full");
		});

		it("should use area threshold for compact", () => {
			// 3x3 = 9 (compact threshold)
			expect(calculateWidgetSize({ w: 3, h: 3 }, "weather")).toBe("compact");
			// 3x4 = 12 (exceeds compact area)
			expect(calculateWidgetSize({ w: 3, h: 4 }, "weather")).toBe("medium");
		});

		it("should use area threshold for medium", () => {
			// 5x6 = 30 (medium threshold)
			expect(calculateWidgetSize({ w: 5, h: 6 }, "weather")).toBe("medium");
			// 6x6 = 36 (exceeds medium area)
			expect(calculateWidgetSize({ w: 6, h: 6 }, "weather")).toBe("full");
		});

		it("should handle edge cases", () => {
			expect(calculateWidgetSize({ w: 1, h: 1 }, "weather")).toBe("compact");
			expect(calculateWidgetSize({ w: 12, h: 12 }, "weather")).toBe("full");
		});
	});
});


