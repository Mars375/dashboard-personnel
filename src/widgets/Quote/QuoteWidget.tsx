// src/widgets/Quote/QuoteWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { RefreshCw, Heart } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import { getRandomQuote, toggleFavorite, loadQuotes, type Quote } from "@/store/quoteStorage";
import { cn } from "@/lib/utils";

function QuoteWidgetComponent({ size = "medium" }: WidgetProps) {
	const [currentQuote, setCurrentQuote] = useState<Quote | null>(() => getRandomQuote());
	const [isFavorite, setIsFavorite] = useState(false);

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);
	const padding = isCompact ? "p-2" : "p-4";

	useEffect(() => {
		if (currentQuote) {
			setIsFavorite(currentQuote.favorite);
		}
	}, [currentQuote]);

	// Refresh automatique toutes les 4 heures en mode compact
	useEffect(() => {
		if (!isCompact) return;
		
		const interval = setInterval(() => {
			const quote = getRandomQuote();
			setCurrentQuote(quote);
			if (quote) {
				setIsFavorite(quote.favorite);
			}
		}, 4 * 60 * 60 * 1000); // 4 heures

		return () => clearInterval(interval);
	}, [isCompact]);

	const handleNewQuote = useCallback(() => {
		const quote = getRandomQuote();
		setCurrentQuote(quote);
		if (quote) {
			setIsFavorite(quote.favorite);
		}
	}, []);

	const handleToggleFavorite = useCallback(() => {
		if (currentQuote) {
			toggleFavorite(currentQuote.id);
			const quotes = loadQuotes();
			const updated = quotes.find((q) => q.id === currentQuote.id);
			if (updated) {
				setIsFavorite(updated.favorite);
			}
		}
	}, [currentQuote]);

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding)}>
			{currentQuote ? (
				<div className="flex flex-col items-center justify-center gap-4 flex-1 text-center">
					<motion.div
						key={currentQuote.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-4"
					>
						<div className={cn("font-medium", isCompact ? "text-sm" : "text-lg")}>
							"{currentQuote.text}"
						</div>
						{currentQuote.author && (
							<div className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
								— {currentQuote.author}
							</div>
						)}
					</motion.div>
					{isFull && (
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleNewQuote}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Nouvelle
							</Button>
							<Button
								variant={isFavorite ? "default" : "outline"}
								size="sm"
								onClick={handleToggleFavorite}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
							</Button>
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-2 flex-1 text-center">
					<div className="text-sm text-muted-foreground">Aucune citation disponible</div>
					<Button
						size="sm"
						onClick={handleNewQuote}
						onMouseDown={(e: React.MouseEvent) => {
							e.stopPropagation();
						}}
						onDragStart={(e: React.DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						Ajouter des citations
					</Button>
				</div>
			)}
		</Card>
	);
}

export const QuoteWidget = memo(QuoteWidgetComponent);

