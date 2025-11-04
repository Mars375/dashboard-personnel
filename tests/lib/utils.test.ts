import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
	describe("cn", () => {
		it("should merge class names", () => {
			const result = cn("class1", "class2");
			expect(result).toContain("class1");
			expect(result).toContain("class2");
		});

		it("should handle conditional classes", () => {
			const result = cn("base", false && "hidden", "visible");
			expect(result).toContain("base");
			expect(result).toContain("visible");
			expect(result).not.toContain("hidden");
		});

		it("should merge Tailwind classes correctly", () => {
			// When both classes conflict, last one should win
			const result = cn("text-red-500", "text-blue-500");
			expect(result).toContain("text-blue-500");
			expect(result).not.toContain("text-red-500");
		});

		it("should handle empty strings and null", () => {
			const result = cn("class1", "", null, undefined, "class2");
			expect(result).toContain("class1");
			expect(result).toContain("class2");
		});

		it("should handle arrays", () => {
			const result = cn(["class1", "class2"], "class3");
			expect(result).toContain("class1");
			expect(result).toContain("class2");
			expect(result).toContain("class3");
		});

		it("should handle objects", () => {
			const result = cn({
				class1: true,
				class2: false,
				class3: true,
			});
			expect(result).toContain("class1");
			expect(result).toContain("class3");
			expect(result).not.toContain("class2");
		});
	});
});

