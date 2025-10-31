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
const mockReset = vi.fn();

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
    suggestions: [{ name: "Paris", country: "FR", state: undefined, lat: 1, lon: 2 }],
    loading: false,
    error: undefined,
    open: true,
    setOpen: () => {},
    activeIndex: -1,
    setActiveIndex: () => {},
    moveActive: () => {},
    reset: mockReset,
  }),
}), { virtual: true });

vi.mock("@/store/weatherStorage", () => ({
  loadLastCity: () => undefined,
  saveLastCity: () => {},
}), { virtual: true });

import { WeatherWidget } from "@/widgets/Weather/WeatherWidget";

describe("WeatherWidget (suggestion click)", () => {
  it("calls fetchWeather and resets autocomplete when suggestion is clicked", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);
    
    const suggestionItem = screen.getByTestId("cmd-item");
    expect(suggestionItem).toBeTruthy();
    
    await user.click(suggestionItem);
    
    // Vérifie que setCity est appelé avec "Paris"
    expect(mockSetCity).toHaveBeenCalledWith("Paris");
    // Vérifie que fetchWeather est appelé avec "Paris"
    expect(mockFetchWeather).toHaveBeenCalledWith("Paris");
    // Vérifie que reset est appelé pour fermer l'autocomplete
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});

