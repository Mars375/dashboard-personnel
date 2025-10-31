import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as WeatherModule from "@/lib/useWeather";
import { useWeather } from "@/lib/useWeather";

function Probe() {
  const s = useWeather("Paris");
  return (
    <div>
      <div data-testid="loading">{String(s.loading)}</div>
      <div data-testid="error">{s.error || ""}</div>
    </div>
  );
}

describe("useWeather (smoke)", () => {
  it("reports error when API key missing without crashing", async () => {
    const spy = vi.spyOn(WeatherModule, "__getApiKeyForTests").mockReturnValue(undefined as any);
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("error").textContent).not.toBe("");
    spy.mockRestore();
  });
});


