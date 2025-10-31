import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

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

vi.mock("@/lib/useWeather", () => ({
  useWeather: () => ({
    city: "Paris",
    setCity: () => {},
    data: { city: "Paris", country: "FR", description: "ensoleillé", icon: "01d", temperatureC: 20, timestamp: Date.now() },
    loading: false,
    error: undefined,
    iconUrl: undefined,
    forecast: [
      { dateISO: "2024-01-01", icon: "01d", description: "sunny", tempMaxC: 25, tempMinC: 15 },
      { dateISO: "2024-01-02", icon: "02d", description: "cloudy", tempMaxC: 22, tempMinC: 12 },
      { dateISO: "2024-01-03", icon: "03d", description: "partly cloudy", tempMaxC: 20, tempMinC: 10 },
      { dateISO: "2024-01-04", icon: "04d", description: "overcast", tempMaxC: 18, tempMinC: 8 },
      { dateISO: "2024-01-05", icon: "09d", description: "rain", tempMaxC: 16, tempMinC: 6 },
    ],
    refresh: () => {},
    fetchWeather: () => {},
  }),
}), { virtual: true });

vi.mock("@/lib/useAutocompleteCity", () => ({
  useAutocompleteCity: () => ({
    query: "",
    setQuery: () => {},
    suggestions: [],
    loading: false,
    error: undefined,
    open: false,
    setOpen: () => {},
    activeIndex: -1,
    setActiveIndex: () => {},
    moveActive: () => {},
    reset: () => {},
  }),
}), { virtual: true });

vi.mock("@/lib/storage", () => ({
  loadLastCity: () => undefined,
  saveLastCity: () => {},
}), { virtual: true });

import { WeatherWidget } from "./WeatherWidget";

describe("WeatherWidget (forecast)", () => {
  it("displays 5-day forecast when available", () => {
    render(<WeatherWidget />);
    
    // Vérifie que la section prévisions est présente
    const forecastSection = screen.getByLabelText("Prévisions sur 5 jours");
    expect(forecastSection).toBeTruthy();
    
    // Vérifie qu'il y a bien 5 prévisions (vérifie les températures affichées)
    const forecastItems = screen.getAllByText(/\d+° \/ \d+°/);
    expect(forecastItems.length).toBe(5);
  });
});

