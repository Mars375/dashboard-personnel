/**
 * Composant TodoFilters - Filtres pour les tâches
 * Extrait de TodoWidget pour améliorer la maintenabilité
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { TODO_FILTERS } from "@/lib/constants";

import type { TodoFilter } from "@/lib/constants";

interface TodoFiltersProps {
	filter: TodoFilter;
	setFilter: (filter: TodoFilter) => void;
	size?: "compact" | "medium" | "full";
}

function TodoFiltersComponent({
	filter,
	setFilter,
	size = "full",
}: TodoFiltersProps) {
	const isCompact = size === "compact";
	const isMedium = size === "medium";

	// Version compacte : pas de filtres visibles
	if (isCompact) {
		return null;
	}

	// Version medium : filtres compacts
	if (isMedium) {
		return (
			<div className="flex gap-1.5">
				<Button
					variant={filter === TODO_FILTERS.ALL ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter(TODO_FILTERS.ALL)}
					className="h-8 text-sm"
				>
					Toutes
				</Button>
				<Button
					variant={filter === TODO_FILTERS.ACTIVE ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter(TODO_FILTERS.ACTIVE)}
					className="h-8 text-sm"
				>
					Actives
				</Button>
				<Button
					variant={filter === TODO_FILTERS.COMPLETED ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter(TODO_FILTERS.COMPLETED)}
					className="h-8 text-sm"
				>
					Terminées
				</Button>
			</div>
		);
	}

	// Version full : tous les filtres
	return (
		<div className="flex gap-2 text-sm items-center flex-wrap">
				<Button
					variant={filter === TODO_FILTERS.ALL ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter(TODO_FILTERS.ALL)}
					aria-label="Toutes les tâches"
				>
					Toutes
				</Button>
				<Button
					variant={filter === TODO_FILTERS.ACTIVE ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter(TODO_FILTERS.ACTIVE)}
					aria-label="Tâches actives"
				>
					Actives
				</Button>
				<Button
					variant={filter === TODO_FILTERS.COMPLETED ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter(TODO_FILTERS.COMPLETED)}
					aria-label="Tâches terminées"
				>
					Terminées
				</Button>
				<Button
					variant={filter === TODO_FILTERS.PRIORITY ? "default" : "outline"}
					size="sm"
					onClick={() => setFilter(TODO_FILTERS.PRIORITY)}
					aria-label="Tâches prioritaires"
				>
					<Star className="h-3 w-3 mr-1" />
					Prioritaires
				</Button>
		</div>
	);
}

export const TodoFilters = memo(TodoFiltersComponent);

