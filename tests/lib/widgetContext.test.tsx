/**
 * Tests pour le WidgetContext
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import { WidgetProvider, useWidgetContext } from "@/lib/widgetContext";

function TestComponent() {
	const { publishData, subscribe, getData } = useWidgetContext();
	const [received, setReceived] = React.useState<any>(null);

	React.useEffect(() => {
		const unsubscribe = subscribe("test-type", (data) => {
			setReceived(data);
		});

		// Publier des données
		publishData("test-widget", "test-type", { value: 42 });

		return unsubscribe;
	}, [publishData, subscribe]);

	return (
		<div>
			{received && <div data-testid="received">{received.data.value}</div>}
			{getData("test-type") && (
				<div data-testid="get-data">{getData("test-type")?.data.value}</div>
			)}
		</div>
	);
}

describe("WidgetContext", () => {
	it("permet de publier et s'abonner aux données", () => {
		const { getByTestId } = render(
			<WidgetProvider>
				<TestComponent />
			</WidgetProvider>
		);

		expect(getByTestId("received")).toHaveTextContent("42");
		expect(getByTestId("get-data")).toHaveTextContent("42");
	});

	it("permet de récupérer les données publiées", () => {
		let contextValue: any;

		function TestGetData() {
			const context = useWidgetContext();
			contextValue = context;

			React.useEffect(() => {
				context.publishData("widget-1", "stocks", { stocks: [{ symbol: "AAPL" }] });
			}, []);

			return null;
		}

		render(
			<WidgetProvider>
				<TestGetData />
			</WidgetProvider>
		);

		act(() => {
			const data = contextValue.getData("stocks");
			expect(data).toBeTruthy();
			expect(data?.data.stocks).toHaveLength(1);
		});
	});
});


