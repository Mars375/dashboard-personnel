/**
 * Tests pour le WidgetContext
 */

import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { WidgetProvider, useWidgetContext } from "@/lib/widgetContext";

describe("WidgetContext", () => {
	it("fournit le contexte aux composants enfants", () => {
		function TestComponent() {
			const context = useWidgetContext();
			expect(context).toBeTruthy();
			expect(context.publishData).toBeInstanceOf(Function);
			expect(context.subscribe).toBeInstanceOf(Function);
			expect(context.getData).toBeInstanceOf(Function);
			expect(context.getAllData).toBeInstanceOf(Function);
			return <div data-testid="test">Test</div>;
		}

		const { container } = render(
			<WidgetProvider>
				<TestComponent />
			</WidgetProvider>
		);

		expect(container.querySelector('[data-testid="test"]')).toBeTruthy();
	});

	it("permet de publier et récupérer des données", async () => {
		function PublisherComponent() {
			const { publishData } = useWidgetContext();
			
			React.useEffect(() => {
				publishData("test-widget", "test-type", { value: 42 });
			}, [publishData]);

			return <div data-testid="publisher">Publisher</div>;
		}

		function ReaderComponent() {
			const { getData } = useWidgetContext();
			const [data, setData] = React.useState<number | null>(null);

			React.useEffect(() => {
				const checkData = () => {
					const result = getData("test-type");
					if (result) {
						setData((result.data as { value: number }).value);
					}
				};
				checkData();
				const interval = setInterval(checkData, 100);
				return () => clearInterval(interval);
			}, [getData]);

			return (
				<div data-testid="reader">
					{data !== null ? <div data-testid="value">{data}</div> : null}
				</div>
			);
		}

		render(
			<WidgetProvider>
				<PublisherComponent />
				<ReaderComponent />
			</WidgetProvider>
		);

		await waitFor(() => {
			const valueElement = screen.getByTestId("value");
			expect(valueElement.textContent).toBe("42");
		});
	});

	it("permet de s'abonner aux données publiées", async () => {
		function PublisherComponent() {
			const { publishData } = useWidgetContext();
			
			React.useEffect(() => {
				setTimeout(() => {
					publishData("widget-1", "stocks", { stocks: [{ symbol: "AAPL" }] });
				}, 100);
			}, [publishData]);

			return null;
		}

		function SubscriberComponent() {
			const { subscribe } = useWidgetContext();
			const [received, setReceived] = React.useState<Array<{ symbol: string }> | null>(null);

			React.useEffect(() => {
				const unsubscribe = subscribe("stocks", (data) => {
					setReceived((data.data as { stocks: Array<{ symbol: string }> }).stocks);
				});
				return unsubscribe;
			}, [subscribe]);

			return (
				<div data-testid="subscriber">
					{received && <div data-testid="stocks-count">{received.length}</div>}
				</div>
			);
		}

		render(
			<WidgetProvider>
				<PublisherComponent />
				<SubscriberComponent />
			</WidgetProvider>
		);

		await waitFor(() => {
			const countElement = screen.getByTestId("stocks-count");
			expect(countElement.textContent).toBe("1");
		}, { timeout: 2000 });
	});

	it("retourne null si aucune donnée n'est disponible", () => {
		function TestComponent() {
			const { getData } = useWidgetContext();
			const data = getData("non-existent");
			return <div data-testid="result">{data === null ? "null" : "not-null"}</div>;
		}

		const { container } = render(
			<WidgetProvider>
				<TestComponent />
			</WidgetProvider>
		);

		const resultElement = container.querySelector('[data-testid="result"]');
		expect(resultElement?.textContent).toBe("null");
	});

	it("permet de récupérer toutes les données d'un type", async () => {
		function PublisherComponent() {
			const { publishData } = useWidgetContext();
			
			React.useEffect(() => {
				publishData("widget-1", "stocks", { stocks: [{ symbol: "AAPL" }] });
				publishData("widget-2", "stocks", { stocks: [{ symbol: "GOOGL" }] });
			}, [publishData]);

			return null;
		}

		function ReaderComponent() {
			const { getAllData } = useWidgetContext();
			const [count, setCount] = React.useState(0);

			React.useEffect(() => {
				const checkData = () => {
					const results = getAllData("stocks");
					setCount(results.length);
				};
				checkData();
				const interval = setInterval(checkData, 100);
				return () => clearInterval(interval);
			}, [getAllData]);

			return <div data-testid="count">{count}</div>;
		}

		render(
			<WidgetProvider>
				<PublisherComponent />
				<ReaderComponent />
			</WidgetProvider>
		);

		await waitFor(() => {
			const countElement = screen.getByTestId("count");
			expect(countElement.textContent).toBe("2");
		});
	});
});
