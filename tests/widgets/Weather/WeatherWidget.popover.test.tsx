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
  PopoverContent: ({ children, ...p }: any) => <div aria-label="popover" {...p}>{children}</div>,
}), { virtual: true });
vi.mock("@/components/ui/command", () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandItem: ({ children, onSelect, ...rest }: any) => (
    <div data-testid="cmd-item" onClick={onSelect} {...rest}>{children}</div>
  ),
  CommandGroup: ({ children, heading }: any) => (
    <div>
      {heading && <div data-testid="cmd-group-heading">{heading}</div>}
      {children}
    </div>
  ),
  CommandEmpty: ({ children }: any) => <div>CommandEmpty</div>,
}), { virtual: true });

vi.mock("@/lib/useWeather", () => ({
  useWeather: () => ({
    city: "Paris",
    setCity: () => {},
    data: { city: "Paris", country: "FR", description: "ensoleillé", icon: "01d", temperatureC: 20, timestamp: Date.now() },
    loading: false,
    error: undefined,
    iconUrl: undefined,
    forecast: [],
    refresh: () => {},
    fetchWeather: () => {},
  }),
}), { virtual: true });

vi.mock("@/lib/useAutocompleteCity", () => ({
  useAutocompleteCity: () => ({
    query: "Par",
    setQuery: () => {},
    suggestions: [{ name: "Paris", country: "FR", state: undefined, lat: 1, lon: 2 }],
    loading: false,
    error: undefined,
    open: true,
    setOpen: () => {},
    activeIndex: 0,
    setActiveIndex: () => {},
    moveActive: () => {},
    reset: () => {},
  }),
}), { virtual: true });

import { WeatherWidget } from "@/widgets/Weather/WeatherWidget";

describe("WeatherWidget (popover)", () => {
  it("shows suggestions popover when open", () => {
    render(<WeatherWidget />);
    // Vérifie que le popover est présent
    expect(screen.getByLabelText("popover")).toBeTruthy();
    // Vérifie que le heading "Suggestions" est présent
    const heading = screen.getByTestId("cmd-group-heading");
    expect(heading.textContent).toBe("Suggestions");
    // Vérifie que la suggestion "Paris" est présente dans le popover (via cmd-item)
    const suggestionItem = screen.getByTestId("cmd-item");
    expect(suggestionItem.textContent).toContain("Paris");
  });
});



