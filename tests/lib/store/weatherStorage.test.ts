import { describe, it, expect, beforeEach } from "vitest";
import {
	loadLastCity,
	saveLastCity,
	loadSavedCities,
	saveSavedCities,
	addSavedCity,
	removeSavedCity,
} from "@/store/weatherStorage";
import type { SavedCity } from "@/store/weatherStorage";

describe("weatherStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("loadLastCity / saveLastCity", () => {
		it("should return undefined when localStorage is empty", () => {
			const city = loadLastCity();
			expect(city).toBeUndefined();
		});

		it("should save and load city", () => {
			const city = "Paris";
			saveLastCity(city);
			
			const loaded = loadLastCity();
			expect(loaded).toBe(city);
		});

		it("should handle save errors gracefully", () => {
			const originalSetItem = localStorage.setItem;
			localStorage.setItem = () => {
				throw new Error("Storage quota exceeded");
			};

			expect(() => saveLastCity("Paris")).not.toThrow();

			localStorage.setItem = originalSetItem;
		});
	});

	describe("loadSavedCities / saveSavedCities", () => {
		it("should return empty array when localStorage is empty", () => {
			const cities = loadSavedCities();
			expect(cities).toEqual([]);
		});

		it("should save and load cities", () => {
			const cities: SavedCity[] = [
				{ name: "Paris", country: "FR", lat: 48.8566, lon: 2.3522 },
				{ name: "London", country: "GB" },
			];

			saveSavedCities(cities);
			const loaded = loadSavedCities();

			expect(loaded).toHaveLength(2);
			expect(loaded[0].name).toBe("Paris");
		});

		it("should handle parse errors gracefully", () => {
			localStorage.setItem("weather:savedCities", "invalid json");
			const cities = loadSavedCities();
			expect(cities).toEqual([]);
		});
	});

	describe("addSavedCity", () => {
		it("should add a new city", () => {
			const city: SavedCity = { name: "Paris", country: "FR" };
			const result = addSavedCity(city);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Paris");
		});

		it("should not add duplicate cities", () => {
			const city: SavedCity = { name: "Paris", country: "FR" };
			
			addSavedCity(city);
			const result = addSavedCity(city); // Try to add again

			expect(result).toHaveLength(1);
		});

		it("should allow cities with same name but different country", () => {
			const city1: SavedCity = { name: "Paris", country: "FR" };
			const city2: SavedCity = { name: "Paris", country: "US" };

			addSavedCity(city1);
			const result = addSavedCity(city2);

			expect(result).toHaveLength(2);
		});
	});

	describe("removeSavedCity", () => {
		it("should remove a city by name", () => {
			const city: SavedCity = { name: "Paris", country: "FR" };
			addSavedCity(city);
			
			const result = removeSavedCity("Paris");

			expect(result).toHaveLength(0);
		});

		it("should not remove non-existent city", () => {
			const result = removeSavedCity("NonExistent");
			expect(result).toEqual([]);
		});
	});
});

