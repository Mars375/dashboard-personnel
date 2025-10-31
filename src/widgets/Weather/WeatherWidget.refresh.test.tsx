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

const mockRefresh = vi.fn();

vi.mock("@/lib/useWeather", () => ({
  useWeather: () => ({
    city: "Paris",
    setCity: () => {},
    data: { city: "Paris", country: "FR", description: "ensoleillé", icon: "01d", temperatureC: 20, timestamp: Date.now() },
    loading: false,
    error: undefined,
    iconUrl: undefined,
    forecast: [],
    refresh: mockRefresh,
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

describe("WeatherWidget (refresh)", () => {
  it("calls refresh when refresh button is clicked", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);
    
    const refreshButton = screen.getByText("Rafraîchir");
    expect(refreshButton).toBeTruthy();
    
    await user.click(refreshButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});

