import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useAutocompleteCity } from "@/hooks/useAutocompleteCity";

function Probe() {
  const ac = useAutocompleteCity("Par", 0, 3, 3); // debounce 0, minChars 3
  return (
    <div>
      <div data-testid="open">{String(ac.open)}</div>
      <div data-testid="count">{String(ac.suggestions.length)}</div>
    </div>
  );
}

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

describe("useAutocompleteCity (smoke)", () => {
  it("opens and shows some suggestions after 3 chars", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok([
      { name: "Paris", lat: 1, lon: 2, country: "FR" },
      { name: "Parma", lat: 3, lon: 4, country: "IT" },
    ]));
    (globalThis as unknown as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId("open").textContent).toBe("true"));
    expect(Number(screen.getByTestId("count").textContent)).toBeGreaterThan(0);
  });
});


