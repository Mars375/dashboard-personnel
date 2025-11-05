/**
 * Composant VirtualizedList - Liste virtualisée pour optimiser les performances
 * Utilise @tanstack/react-virtual pour ne rendre que les éléments visibles
 */

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type ReactNode } from "react";
import { getEstimatedItemHeight } from "@/lib/performance";

interface VirtualizedListProps<T> {
	items: T[];
	itemHeight?: number | ((index: number) => number);
	renderItem: (item: T, index: number) => ReactNode;
	className?: string;
	overscan?: number;
	widgetSize?: "compact" | "medium" | "full";
	containerHeight?: string | number;
}

export function VirtualizedList<T>({
	items,
	itemHeight,
	renderItem,
	className = "",
	overscan = 5,
	widgetSize = "medium",
	containerHeight = "100%",
}: VirtualizedListProps<T>) {
	const parentRef = useRef<HTMLDivElement>(null);

	// Utiliser la hauteur estimée si non fournie
	const estimatedHeight =
		itemHeight ||
		(() => getEstimatedItemHeight(widgetSize));

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize:
			typeof estimatedHeight === "function"
				? estimatedHeight
				: () => estimatedHeight,
		overscan,
	});

	return (
		<div
			ref={parentRef}
			className={`overflow-auto ${className}`}
			style={{ height: containerHeight }}
		>
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{virtualizer.getVirtualItems().map((virtualItem) => (
					<div
						key={virtualItem.key}
						data-index={virtualItem.index}
						ref={virtualizer.measureElement}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							transform: `translateY(${virtualItem.start}px)`,
						}}
					>
						{renderItem(items[virtualItem.index], virtualItem.index)}
					</div>
				))}
			</div>
		</div>
	);
}

