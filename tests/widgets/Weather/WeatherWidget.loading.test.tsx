import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

vi.mock("@/components/ui/card", () => ({ Card: ({ children, ...p }: any) => <div {...p}>{children}</div> }), { virtual: true });
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...p }: any) => <button {...p}>{children}</button> }), { virtual: true });
vi.mock("@/components/ui/input", () => ({ Input: (props: any) => <input {...props} /> }), { virtual: true });
vi.mock("@/components/ui/skeleton", () => ({ Skeleton: (props: any) => <div role="status" {...props} /> }), { virtual: true });
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

vi.mock("@/hooks/useWeather", () => ({
  useWeather: () => ({
    city: "Paris",
    setCity: () => {},
    data: undefined,
    loading: true,
    error: undefined,
    iconUrl: undefined,
    forecast: [],
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

describe("WeatherWidget (loading)", () => {
  it("renders skeleton loader", () => {
    render(<WeatherWidget />);
    const statusElements = screen.getAllByRole("status");
    expect(statusElements.length).toBeGreaterThan(0);
    // Vérifie qu'au moins un skeleton est présent
    expect(statusElements[0].className).toContain("grid");
  });
});



