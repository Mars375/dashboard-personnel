// src/widgets/Stock/StockWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, RefreshCw, X, DollarSign, Check } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import { loadWatchlist, addToWatchlist, removeFromWatchlist, getCachedStock, cacheStock, type Stock, type StockWatchlist } from "@/store/stockStorage";
import { fetchStockQuote, fetchMultipleStockQuotes, searchStocks, type StockSearchResult } from "@/lib/api/stockApi";
import { cn } from "@/lib/utils";
import { useWidgetContext } from "@/lib/widgetContext";
import { logger } from "@/lib/logger";

function StockWidgetComponent({ size = "medium" }: WidgetProps) {
	const [watchlist, setWatchlist] = useState<StockWatchlist[]>(() => loadWatchlist());
	const [stocks, setStocks] = useState<Stock[]>([]);
	const [loading, setLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedResult, setSelectedResult] = useState<StockSearchResult | null>(null);
	const { publishData } = useWidgetContext();

	const isCompact = useMemo(() => size === "compact", [size]);
	const isMedium = useMemo(() => size === "medium", [size]);
	const isFull = useMemo(() => size === "full", [size]);
	const padding = isCompact ? "p-2" : isMedium ? "p-3" : "p-4";
	const gap = isCompact ? "gap-1" : isMedium ? "gap-1.5" : "gap-2";

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
			logger.error("Erreur lors du chargement des actions:", error);
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

	// Recherche avec debounce
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.length < 2) {
			setSearchResults([]);
			setSelectedResult(null);
			return;
		}

		const timeoutId = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await searchStocks(searchQuery);
				setSearchResults(results);
			} catch (error) {
				logger.error("Erreur recherche:", error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300); // Debounce de 300ms

		return () => clearTimeout(timeoutId);
	}, [searchQuery]);

	const handleAddSymbol = useCallback(async () => {
		const symbolToAdd = selectedResult?.symbol || searchQuery.trim().toUpperCase();
		
		if (!symbolToAdd) return;

		// Vérifier si déjà dans la watchlist
		if (symbols.includes(symbolToAdd)) {
			alert("Cette action est déjà dans votre watchlist");
			return;
		}

		// Vérifier que l'action existe en essayant de la récupérer
		setLoading(true);
		try {
			const quote = await fetchStockQuote(symbolToAdd);
			if (quote) {
				const stock: Stock = {
					...quote,
					lastUpdate: new Date().toISOString(),
				};
				cacheStock(symbolToAdd, stock);
				addToWatchlist(symbolToAdd);
				setWatchlist(loadWatchlist());
				setSearchQuery("");
				setSelectedResult(null);
				setSearchResults([]);
				setIsDialogOpen(false);
				loadStocks();
			} else {
				alert("Action introuvable. Vérifiez le symbole ou le nom.");
			}
		} catch (error) {
			logger.error("Erreur:", error);
			alert("Erreur lors de l'ajout de l'action");
		} finally {
			setLoading(false);
		}
	}, [selectedResult, searchQuery, symbols, loadStocks]);

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
			{(isFull || isMedium) && (
				<div className={cn("space-y-2 shrink-0", isMedium && "space-y-1.5")}>
					<div className="flex items-center justify-between">
						<h3 className={cn("font-semibold", isMedium ? "text-xs" : "text-sm")}>Bourse</h3>
						{isFull && (
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
						)}
						{isMedium && (
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
								<Plus className={cn("h-3 w-3", isMedium && "mr-1")} />
								{!isMedium && "Ajouter"}
							</Button>
						)}
					</div>
					{stocks.length > 0 && (
						<div className={cn("flex items-center text-muted-foreground", isMedium ? "gap-2 text-[10px]" : "gap-3 text-xs")}>
							<div className="flex items-center gap-1">
								{totalChange >= 0 ? (
									<TrendingUp className={cn("text-green-500", isMedium ? "h-2.5 w-2.5" : "h-3 w-3")} />
								) : (
									<TrendingDown className={cn("text-red-500", isMedium ? "h-2.5 w-2.5" : "h-3 w-3")} />
								)}
								<span className={cn(
									isMedium ? "text-xs font-bold" : "",
									totalChange >= 0 ? "text-green-600" : "text-red-600"
								)}>
									{totalChangePercent.toFixed(isMedium ? 1 : 2)}%
								</span>
							</div>
							<div>
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

			{(isFull || isMedium) && (
				<div className="flex-1 overflow-y-auto space-y-2">
					{loading && stocks.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className={cn("animate-spin text-muted-foreground", isMedium ? "h-4 w-4" : "h-6 w-6")} />
						</div>
					) : stocks.length === 0 ? (
						<div className={cn("text-muted-foreground text-center py-8", isMedium ? "text-xs" : "text-sm")}>
							Aucune action dans votre watchlist
						</div>
					) : (
						stocks.slice(0, isMedium ? 5 : undefined).map((stock) => (
							<motion.div
								key={stock.symbol}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className={cn("rounded-md border bg-card", isMedium ? "p-2" : "p-3")}
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
										<X className="h-4 w-4" />
									</Button>
								</div>
							</motion.div>
						))
					)}
				</div>
			)}

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Ajouter une action</DialogTitle>
						<DialogDescription>
							Recherchez par symbole (AAPL, TSLA) ou par nom (Apple, Bitcoin, Tesla)
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Command className="rounded-lg border shadow-md">
							<div className="flex h-10 items-center gap-2 border-b px-3 bg-muted/30">
								<Search className="size-4 shrink-0 opacity-50" aria-hidden="true" />
								<CommandPrimitive.Input
									placeholder="Rechercher par symbole ou nom..."
									value={searchQuery}
									onValueChange={setSearchQuery}
									className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
									onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
										if (e.key === "Enter" && selectedResult) {
											handleAddSymbol();
										}
									}}
								/>
							</div>
							<CommandList>
								{isSearching && (
									<div className="flex items-center justify-center py-6">
										<RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								)}
								{!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
									<CommandEmpty>
										{searchQuery.length < 2 
											? "Tapez au moins 2 caractères..."
											: "Aucun résultat trouvé"}
									</CommandEmpty>
								)}
								{!isSearching && searchResults.length > 0 && (
									<CommandGroup>
										{searchResults.map((result) => (
											<CommandItem
												key={result.symbol}
												value={`${result.symbol} ${result.name}`}
												onSelect={() => {
													setSelectedResult(result);
													setSearchQuery(`${result.symbol} - ${result.name}`);
												}}
												className="cursor-pointer"
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedResult?.symbol === result.symbol
															? "opacity-100"
															: "opacity-0"
													)}
												/>
												<div className="flex flex-col flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="font-semibold">{result.symbol}</span>
														{result.exchange && (
															<span className="text-xs text-muted-foreground">
																({result.exchange})
															</span>
														)}
													</div>
													<span className="text-sm text-muted-foreground truncate">
														{result.name}
													</span>
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								)}
							</CommandList>
						</Command>
						{selectedResult && (
							<div className="text-xs text-muted-foreground p-2 bg-muted rounded">
								Sélectionné : <span className="font-semibold">{selectedResult.symbol}</span> - {selectedResult.name}
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsDialogOpen(false);
								setSearchQuery("");
								setSelectedResult(null);
								setSearchResults([]);
							}}
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
							disabled={loading || (!selectedResult && !searchQuery.trim())}
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

