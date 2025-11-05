// src/widgets/Stock/StockWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, RefreshCw, Trash2, DollarSign } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import { loadWatchlist, addToWatchlist, removeFromWatchlist, getCachedStock, cacheStock, type Stock, type StockWatchlist } from "@/store/stockStorage";
import { fetchStockQuote, fetchMultipleStockQuotes } from "@/lib/api/stockApi";
import { cn } from "@/lib/utils";
import { useWidgetContext } from "@/lib/widgetContext";

function StockWidgetComponent({ size = "medium" }: WidgetProps) {
	const [watchlist, setWatchlist] = useState<StockWatchlist[]>(() => loadWatchlist());
	const [stocks, setStocks] = useState<Stock[]>([]);
	const [loading, setLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newSymbol, setNewSymbol] = useState("");
	const { publishData } = useWidgetContext();

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);
	const padding = isCompact ? "p-2" : "p-4";
	const gap = isCompact ? "gap-1" : "gap-2";

	const currentWatchlist = useMemo(() => watchlist[0] || null, [watchlist]);
	const symbols = useMemo(() => currentWatchlist?.symbols || [], [currentWatchlist]);

	// Charger les données des actions
	const loadStocks = useCallback(async () => {
		if (symbols.length === 0) {
			setStocks([]);
			return;
		}

		setLoading(true);
		try {
			// Vérifier le cache d'abord
			const cachedStocks: Stock[] = [];
			const symbolsToFetch: string[] = [];

			for (const symbol of symbols) {
				const cached = getCachedStock(symbol);
				if (cached) {
					cachedStocks.push(cached);
				} else {
					symbolsToFetch.push(symbol);
				}
			}

			// Récupérer les actions non en cache
			if (symbolsToFetch.length > 0) {
				const quotes = await fetchMultipleStockQuotes(symbolsToFetch);
				const newStocks: Stock[] = quotes.map((quote) => ({
					...quote,
					lastUpdate: new Date().toISOString(),
				}));

				// Mettre en cache
				newStocks.forEach((stock) => cacheStock(stock.symbol, stock));

				// Combiner avec les données en cache
				const allStocks = [...cachedStocks, ...newStocks];
				setStocks(allStocks);

				// Publier les données pour les autres widgets
				publishData("stock-widget", "stocks", { stocks: allStocks });
			} else {
				setStocks(cachedStocks);
			}
		} catch (error) {
			console.error("Erreur lors du chargement des actions:", error);
		} finally {
			setLoading(false);
		}
	}, [symbols, publishData]);

	useEffect(() => {
		loadStocks();
		// Rafraîchir toutes les 5 minutes
		const interval = setInterval(loadStocks, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, [loadStocks]);

	const handleAddSymbol = useCallback(async () => {
		if (!newSymbol.trim()) return;

		const symbol = newSymbol.trim().toUpperCase();
		
		// Vérifier si déjà dans la watchlist
		if (symbols.includes(symbol)) {
			alert("Cette action est déjà dans votre watchlist");
			return;
		}

		// Vérifier que l'action existe en essayant de la récupérer
		setLoading(true);
		try {
			const quote = await fetchStockQuote(symbol);
			if (quote) {
				const stock: Stock = {
					...quote,
					lastUpdate: new Date().toISOString(),
				};
				cacheStock(symbol, stock);
				addToWatchlist(symbol);
				setWatchlist(loadWatchlist());
				setNewSymbol("");
				setIsDialogOpen(false);
				loadStocks();
			} else {
				alert("Action introuvable. Vérifiez le symbole.");
			}
		} catch (error) {
			console.error("Erreur:", error);
			alert("Erreur lors de l'ajout de l'action");
		} finally {
			setLoading(false);
		}
	}, [newSymbol, symbols, loadStocks]);

	const handleRemoveSymbol = useCallback((symbol: string) => {
		if (currentWatchlist && confirm(`Retirer ${symbol} de la watchlist ?`)) {
			removeFromWatchlist(symbol, currentWatchlist.id);
			setWatchlist(loadWatchlist());
			setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
		}
	}, [currentWatchlist]);

	const totalChange = useMemo(() => {
		return stocks.reduce((sum, stock) => sum + stock.change, 0);
	}, [stocks]);

	const totalChangePercent = useMemo(() => {
		if (stocks.length === 0) return 0;
		return stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / stocks.length;
	}, [stocks]);

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding, gap)}>
			{isFull && (
				<div className="space-y-2 shrink-0">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Bourse</h3>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setIsDialogOpen(true)}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Plus className="h-4 w-4 mr-2" />
							Ajouter
						</Button>
					</div>
					{stocks.length > 0 && (
						<div className="flex items-center gap-3 text-xs">
							<div className="flex items-center gap-1">
								{totalChange >= 0 ? (
									<TrendingUp className="h-3 w-3 text-green-500" />
								) : (
									<TrendingDown className="h-3 w-3 text-red-500" />
								)}
								<span className={cn(
									totalChange >= 0 ? "text-green-600" : "text-red-600"
								)}>
									{totalChangePercent.toFixed(2)}%
								</span>
							</div>
							<div className="text-muted-foreground">
								{stocks.length} action{stocks.length > 1 ? "s" : ""}
							</div>
						</div>
					)}
				</div>
			)}

			{isCompact && (
				<div className="flex flex-col gap-2 flex-1 overflow-y-auto">
					<div className="flex items-center justify-between shrink-0 pb-1 border-b">
						<div className="flex items-center gap-1.5">
							<DollarSign className="h-4 w-4 text-muted-foreground" />
							<div className="text-xs font-bold">{stocks.length}</div>
							<div className="text-[10px] text-muted-foreground">actions</div>
						</div>
						{totalChangePercent !== 0 && (
							<div className={cn(
								"text-xs font-bold flex items-center gap-1",
								totalChangePercent >= 0 ? "text-green-600" : "text-red-600"
							)}>
								{totalChangePercent >= 0 ? (
									<TrendingUp className="h-3 w-3" />
								) : (
									<TrendingDown className="h-3 w-3" />
								)}
								{totalChangePercent.toFixed(1)}%
							</div>
						)}
					</div>
					{loading ? (
						<div className="flex items-center justify-center flex-1">
							<RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
						</div>
					) : stocks.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 flex-1 text-center">
							<DollarSign className="h-6 w-6 text-muted-foreground" />
							<div className="text-xs text-muted-foreground">Aucune action</div>
						</div>
					) : (
						stocks.slice(0, 5).map((stock) => (
							<div
								key={stock.symbol}
								className="p-2 rounded border bg-card"
							>
								<div className="flex items-center justify-between mb-1">
									<div className="flex-1 min-w-0">
										<div className="text-xs font-bold truncate">{stock.symbol}</div>
										<div className="text-[10px] text-muted-foreground truncate">{stock.name}</div>
									</div>
									<div className="text-right shrink-0">
										<div className="text-xs font-bold">{stock.price.toFixed(2)}€</div>
										<div className={cn(
											"text-[10px] flex items-center gap-0.5",
											stock.change >= 0 ? "text-green-600" : "text-red-600"
										)}>
											{stock.change >= 0 ? (
												<TrendingUp className="h-2.5 w-2.5" />
											) : (
												<TrendingDown className="h-2.5 w-2.5" />
											)}
											{stock.changePercent.toFixed(2)}%
										</div>
									</div>
								</div>
							</div>
						))
					)}
					{stocks.length > 5 && (
						<div className="text-[10px] text-muted-foreground text-center pt-1">
							+{stocks.length - 5} autres
						</div>
					)}
				</div>
			)}

			{isFull && (
				<div className="flex-1 overflow-y-auto space-y-2">
					{loading && stocks.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : stocks.length === 0 ? (
						<div className="text-sm text-muted-foreground text-center py-8">
							Aucune action dans votre watchlist
						</div>
					) : (
						stocks.map((stock) => (
							<motion.div
								key={stock.symbol}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3 rounded-md border bg-card"
							>
								<div className="flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<div className="font-bold">{stock.symbol}</div>
										<div className="text-xs text-muted-foreground truncate">{stock.name}</div>
										<div className="text-xs text-muted-foreground mt-1">
											Volume: {stock.volume.toLocaleString()}
										</div>
									</div>
									<div className="text-right shrink-0">
										<div className="text-lg font-bold">{stock.price.toFixed(2)}€</div>
										<div className={cn(
											"text-sm flex items-center gap-1",
											stock.change >= 0 ? "text-green-600" : "text-red-600"
										)}>
											{stock.change >= 0 ? (
												<TrendingUp className="h-4 w-4" />
											) : (
												<TrendingDown className="h-4 w-4" />
											)}
											{stock.change.toFixed(2)}€ ({stock.changePercent.toFixed(2)}%)
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-destructive hover:text-destructive"
										onClick={() => handleRemoveSymbol(stock.symbol)}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										aria-label="Retirer"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</motion.div>
						))
					)}
				</div>
			)}

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ajouter une action</DialogTitle>
						<DialogDescription>
							Entrez le symbole de l'action (ex: AAPL, TSLA, MSFT)
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Symbole (ex: AAPL)"
							value={newSymbol}
							onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleAddSymbol();
								}
							}}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Annuler
						</Button>
						<Button
							onClick={handleAddSymbol}
							disabled={loading || !newSymbol.trim()}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							{loading ? (
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Plus className="h-4 w-4 mr-2" />
							)}
							Ajouter
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

export const StockWidget = memo(StockWidgetComponent);

