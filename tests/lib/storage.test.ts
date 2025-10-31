import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveLastCity, loadLastCity } from "@/lib/storage";

describe("storage", () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      return store[key] ?? null;
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      delete store[key];
    });
    vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    });
  });

  it("saves and loads last city", () => {
    saveLastCity("Paris");
    expect(loadLastCity()).toBe("Paris");
    
    saveLastCity("Lyon");
    expect(loadLastCity()).toBe("Lyon");
  });

  it("returns undefined when no city is saved", () => {
    expect(loadLastCity()).toBeUndefined();
  });

  it("handles localStorage errors gracefully", () => {
    // Simule une erreur localStorage
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    
    // Ne doit pas lever d'erreur
    expect(() => saveLastCity("Paris")).not.toThrow();
    
    // Simule une erreur sur getItem
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    
    // Doit retourner undefined sans lever d'erreur
    expect(loadLastCity()).toBeUndefined();
  });
});

