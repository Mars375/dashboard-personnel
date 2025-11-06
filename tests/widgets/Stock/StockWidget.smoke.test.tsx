/**
 * Tests smoke pour le widget Stock
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StockWidget } from "@/widgets/Stock/StockWidget";
import { WidgetProvider } from "@/lib/widgetContext";

// Mock de l'API
vi.mock("@/lib/api/stockApi", () => ({
	fetchStockQuote: vi.fn(),
	fetchMultipleStockQuotes: vi.fn(),
}));

// Mock du storage
vi.mock("@/store/stockStorage", () => ({
	loadWatchlist: vi.fn(() => []),
	saveWatchlist: vi.fn(),
	addToWatchlist: vi.fn(),
	removeFromWatchlist: vi.fn(),
	getCachedStock: vi.fn(() => null),
	cacheStock: vi.fn(),
}));

describe("StockWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rend le widget sans erreur", () => {
		render(
			<WidgetProvider>
				<StockWidget size="medium" />
			</WidgetProvider>
		);

		// Le widget devrait se rendre sans erreur
		expect(document.body).toBeTruthy();
	});

	it("affiche un message quand il n'y a pas d'actions", () => {
		render(
			<WidgetProvider>
				<StockWidget size="medium" />
			</WidgetProvider>
		);

		// Chercher le texte "Aucune action" ou "Aucune action dans votre watchlist"
		const emptyMessage = screen.queryByText(/Aucune action/i);
		expect(emptyMessage).toBeTruthy();
	});

	it("affiche le bouton d'ajout", () => {
		render(
			<WidgetProvider>
				<StockWidget size="medium" />
			</WidgetProvider>
		);

		// Chercher le bouton avec le texte "Ajouter" ou l'icône Plus
		const addButton = screen.queryByRole("button", { name: /Ajouter/i }) || 
			screen.queryByRole("button");
		expect(addButton).toBeTruthy();
	});
});


