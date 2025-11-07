/**
 * Composants Recharts avec lazy loading
 * Charge les graphiques uniquement quand nécessaire pour réduire le bundle initial
 */

import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PieProps, CellProps } from "recharts";

// Lazy loading des composants Recharts
const RechartsPieChart = lazy(() =>
	import("recharts").then((rechartsModule) => ({
		default: rechartsModule.PieChart,
	})) as Promise<{ default: React.ComponentType<React.ComponentProps<typeof import("recharts").PieChart>> }>
);

const RechartsPie = lazy(() =>
	import("recharts").then((module) => ({
		default: module.Pie,
	})) as Promise<{ default: React.ComponentType<PieProps> }>
);

const RechartsCell = lazy(() =>
	import("recharts").then((module) => ({
		default: module.Cell,
	})) as Promise<{ default: React.ComponentType<CellProps> }>
);

// Types pour les props
interface LazyPieChartProps {
	children?: React.ReactNode;
	width?: number;
	height?: number;
	[key: string]: unknown;
}

interface LazyPieProps extends PieProps {
	children?: React.ReactNode;
}

interface LazyCellProps extends CellProps {}

// Wrapper avec Suspense pour PieChart
export function LazyPieChart({ children, ...props }: LazyPieChartProps) {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-full">
					<Skeleton className="h-full w-full" />
				</div>
			}
		>
			<RechartsPieChart {...props}>{children}</RechartsPieChart>
		</Suspense>
	);
}

// Wrapper avec Suspense pour Pie
export function LazyPie({ children, ...props }: LazyPieProps) {
	return (
		<Suspense fallback={null}>
			<RechartsPie {...props}>{children}</RechartsPie>
		</Suspense>
	);
}

// Wrapper avec Suspense pour Cell
export function LazyCell({ ...props }: LazyCellProps) {
	return (
		<Suspense fallback={null}>
			<RechartsCell {...props} />
		</Suspense>
	);
}

