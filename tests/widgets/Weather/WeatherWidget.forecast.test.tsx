import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

// Mock weatherStorage - retourner une ville pour que le widget puisse l'afficher
vi.mock("@/store/weatherStorage", () => ({
  loadSavedCities: () => [{ name: "Paris", country: "FR" }],
  loadLastCity: () => "Paris",
  saveSavedCities: () => {},
  addSavedCity: () => {},
  removeSavedCity: () => {},
  saveLastCity: () => {},
}), { virtual: true });

vi.mock("@/hooks/useWeather", () => ({
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

vi.mock("@/hooks/useAutocompleteCity", () => ({
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

import { WeatherWidget } from "@/widgets/Weather/WeatherWidget";
import userEvent from "@testing-library/user-event";

describe("WeatherWidget (forecast)", () => {
  it("displays 5-day forecast when available", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget size="full" />);
    
    // Le widget doit avoir au moins une ville sauvegardée pour afficher les prévisions
    // Dans le mock, loadSavedCities retourne [{ name: "Paris", country: "FR" }]
    // Il faut cliquer sur la ville pour voir les détails avec les prévisions
    // Chercher tous les éléments cliquables qui pourraient être la ville
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
    
    // Trouver le bouton/élément de la ville Paris (peut être dans un div cliquable)
    const parisElement = screen.getByText(/Paris/i);
    expect(parisElement).toBeTruthy();
    
    // Cliquer sur l'élément parent cliquable (probablement le parent de la ville)
    const clickableParent = parisElement.closest("div[onClick], button");
    if (clickableParent) {
      await user.click(clickableParent as HTMLElement);
    } else {
      // Essayer de cliquer directement sur l'élément
      await user.click(parisElement);
    }
    
    // Attendre que les prévisions soient affichées
    await waitFor(() => {
      const forecastText = screen.getByText("Prévisions");
      expect(forecastText).toBeTruthy();
    });
    
    // Vérifie qu'il y a bien 5 prévisions (vérifie les températures affichées)
    const forecastItems = screen.getAllByText(/\d+°\/\d+°/);
    expect(forecastItems.length).toBe(5);
  });
});

