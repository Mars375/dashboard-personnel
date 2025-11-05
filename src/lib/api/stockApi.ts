/**
 * API pour récupérer les données boursières
 * Utilise une API gratuite (ex: Alpha Vantage, Yahoo Finance via proxy)
 */

export interface StockQuote {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
	volume: number;
	marketCap?: number;
}

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "";

/**
 * Récupère les données d'une action via Alpha Vantage
 */
async function fetchFromAlphaVantage(symbol: string): Promise<StockQuote | null> {
	if (!API_KEY) return null;

	try {
		const response = await fetch(
			`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
		);
		const data = await response.json();
		
		if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
			const quote = data["Global Quote"];
			return {
				symbol: quote["01. symbol"],
				name: quote["01. symbol"], // Alpha Vantage ne fournit pas le nom complet
				price: parseFloat(quote["05. price"]),
				change: parseFloat(quote["09. change"]),
				changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
				volume: parseInt(quote["06. volume"]),
			};
		}
	} catch (error) {
		console.error("Erreur Alpha Vantage:", error);
	}
	return null;
}

/**
 * Récupère les données d'une action via Yahoo Finance (proxy)
 * Note: Utilise un service proxy public qui peut être limité
 */
async function fetchFromYahooFinance(symbol: string): Promise<StockQuote | null> {
	try {
		// Utiliser un proxy public pour Yahoo Finance
		const response = await fetch(
			`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
		);
		
		if (!response.ok) {
			throw new Error("Erreur réseau");
		}
		
		const data = await response.json();
		
		if (data.chart && data.chart.result && data.chart.result[0]) {
			const result = data.chart.result[0];
			const meta = result.meta;
			const quote = result.indicators.quote[0];
			
			if (meta && quote) {
				const currentPrice = meta.regularMarketPrice || meta.previousClose;
				const previousClose = meta.previousClose || currentPrice;
				const change = currentPrice - previousClose;
				const changePercent = (change / previousClose) * 100;
				
				return {
					symbol: meta.symbol,
					name: meta.longName || meta.shortName || meta.symbol,
					price: currentPrice,
					change: change,
					changePercent: changePercent,
					volume: meta.regularMarketVolume || 0,
					marketCap: meta.marketCap,
				};
			}
		}
	} catch (error) {
		console.error("Erreur Yahoo Finance:", error);
	}
	return null;
}

/**
 * Récupère les données d'une action
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
	// Essayer Alpha Vantage d'abord si une clé API est disponible
	if (API_KEY) {
		const data = await fetchFromAlphaVantage(symbol);
		if (data) return data;
	}
	
	// Sinon, utiliser Yahoo Finance
	return fetchFromYahooFinance(symbol);
}

/**
 * Récupère plusieurs actions en parallèle
 */
export async function fetchMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
	const promises = symbols.map((symbol) => fetchStockQuote(symbol));
	const results = await Promise.allSettled(promises);
	
	return results
		.filter((result): result is PromiseFulfilledResult<StockQuote> => 
			result.status === "fulfilled" && result.value !== null
		)
		.map((result) => result.value);
}

