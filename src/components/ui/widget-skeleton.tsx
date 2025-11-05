/**
 * Composants Skeleton pour les widgets
 * Utilise le composant Skeleton de shadcn/ui pour afficher des placeholders
 * pendant le chargement des widgets
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WidgetSkeletonProps {
	widgetType: string;
	className?: string;
}

/**
 * Skeleton générique pour un widget
 */
export function WidgetSkeleton({ widgetType, className }: WidgetSkeletonProps) {
	switch (widgetType) {
		case "weather":
			return <WeatherSkeleton className={className} />;
		case "todo":
			return <TodoSkeleton className={className} />;
		case "calendar":
			return <CalendarSkeleton className={className} />;
		default:
			return <GenericWidgetSkeleton className={className} />;
	}
}

/**
 * Skeleton pour le widget Weather
 */
function WeatherSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("h-full w-full p-4 space-y-4", className)}>
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-4 w-24" />
			</div>
			{/* Température principale */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-16 w-16 rounded-full" />
				<div className="space-y-2 flex-1">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			{/* Prévisions */}
			<div className="space-y-2">
				<Skeleton className="h-4 w-20" />
				<div className="flex gap-2">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="flex-1 space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-3/4" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton pour le widget Todo
 */
function TodoSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("h-full w-full p-4 space-y-4", className)}>
			{/* Header */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-8 w-8 rounded" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-20" />
				</div>
			</div>
			{/* Barre de recherche */}
			<Skeleton className="h-9 w-full" />
			{/* Liste de tâches */}
			<div className="space-y-2">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="flex items-center gap-3 p-2 rounded">
						<Skeleton className="h-5 w-5 rounded" />
						<div className="flex-1 space-y-1">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-3 w-2/3" />
						</div>
						<Skeleton className="h-4 w-4 rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton pour le widget Calendar
 */
function CalendarSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("h-full w-full p-4 space-y-4", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-6 w-32" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-8 rounded" />
					<Skeleton className="h-8 w-8 rounded" />
				</div>
			</div>
			{/* Navigation du calendrier */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-24" />
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-8 w-24" />
			</div>
			{/* Grille du calendrier */}
			<div className="grid grid-cols-7 gap-2">
				{/* Jours de la semaine */}
				{[...Array(7)].map((_, i) => (
					<Skeleton key={`day-${i}`} className="h-6 w-full" />
				))}
				{/* Dates */}
				{[...Array(35)].map((_, i) => (
					<Skeleton key={`date-${i}`} className="h-10 w-full rounded" />
				))}
			</div>
			{/* Liste d'événements */}
			<div className="space-y-2">
				<Skeleton className="h-4 w-20" />
				{[...Array(3)].map((_, i) => (
					<div key={i} className="flex items-center gap-2 p-2 rounded">
						<Skeleton className="h-2 w-2 rounded-full" />
						<Skeleton className="h-4 flex-1" />
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton générique pour les widgets non spécifiés
 */
function GenericWidgetSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("h-full w-full p-4 space-y-4", className)}>
			<Skeleton className="h-6 w-32" />
			<div className="space-y-2">
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className="h-4 w-full" />
				))}
			</div>
		</div>
	);
}

