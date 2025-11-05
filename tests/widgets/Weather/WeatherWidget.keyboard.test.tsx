import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ui/card", () => ({ Card: ({ children, ...p }: any) => <div {...p}>{children}</div> }), { virtual: true });
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...p }: any) => <button {...p}>{children}</button> }), { virtual: true });
vi.mock("@/components/ui/input", () => ({ Input: (props: any) => <input {...props} /> }), { virtual: true });
vi.mock("@/components/ui/skeleton", () => ({ Skeleton: (props: any) => <div {...props} /> }), { virtual: true });
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });
vi.mock("@/components/ui/command", () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandItem: ({ children, onSelect, ...rest }: any) => (
    <div data-testid="cmd-item" onClick={onSelect} {...rest}>{children}</div>
  ),
  CommandGroup: ({ children }: any) => <div>{children}</div>,
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });

const mockFetchWeather = vi.fn();
const mockSetCity = vi.fn();
const mockMoveActive = vi.fn();
const mockReset = vi.fn();

// Mock weatherStorage
vi.mock("@/store/weatherStorage", () => ({
  loadSavedCities: () => [],
  loadLastCity: () => undefined,
  saveSavedCities: () => {},
  addSavedCity: () => {},
  removeSavedCity: () => {},
  saveLastCity: () => {},
}), { virtual: true });

vi.mock("@/hooks/useWeather", () => ({
  useWeather: () => ({
    city: "Par",
    setCity: mockSetCity,
    data: undefined,
    loading: false,
    error: undefined,
    iconUrl: undefined,
    forecast: [],
    refresh: () => {},
    fetchWeather: mockFetchWeather,
  }),
}), { virtual: true });

vi.mock("@/hooks/useAutocompleteCity", () => ({
  useAutocompleteCity: () => ({
    query: "Par",
    setQuery: () => {},
    suggestions: [
      { name: "Paris", country: "FR", state: undefined, lat: 1, lon: 2 },
      { name: "Parme", country: "IT", state: undefined, lat: 3, lon: 4 },
    ],
    loading: false,
    error: undefined,
    open: true,
    setOpen: () => {},
    activeIndex: 0,
    setActiveIndex: () => {},
    moveActive: mockMoveActive,
    reset: mockReset,
  }),
}), { virtual: true });


import { WeatherWidget } from "@/widgets/Weather/WeatherWidget";

describe("WeatherWidget (keyboard navigation)", () => {
  it("navigates suggestions with arrow keys and selects with Enter", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget size="full" />);
    
    const input = screen.getByPlaceholderText("Rechercher et ajouter une ville...");
    expect(input).toBeTruthy();
    
    // Test ArrowDown
    await user.type(input, "{ArrowDown}");
    expect(mockMoveActive).toHaveBeenCalledWith(1);
    
    // Test ArrowUp
    await user.type(input, "{ArrowUp}");
    expect(mockMoveActive).toHaveBeenCalledWith(-1);
    
    // Test Enter avec suggestion active (activeIndex >= 0)
    // Dans le mock, activeIndex est 0, donc Enter devrait sélectionner "Paris"
    mockMoveActive.mockClear();
    await user.type(input, "{Enter}");
    
    // Quand on appuie sur Enter, le code met à jour searchCity avec s.name et appelle ac.reset()
    // Mais setCity et fetchWeather ne sont pas appelés directement, ils sont appelés lors de la soumission du formulaire
    // Vérifions que reset est appelé
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});

